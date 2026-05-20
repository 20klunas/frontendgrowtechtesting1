"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import { clearTrustedDeviceCredential } from "../lib/trustedDevicePreference";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const AdminAuthContext = createContext(null);

let cachedAdminToken = null;
let cachedAdminPayload = null;
let inFlightAdminPromise = null;
let inFlightAdminToken = null;

function buildUrl(path) {
  if (API.endsWith("/api/v1")) {
    return `${API}${path}`;
  }
  return `${API}/api/v1${path}`;
}

function getToken() {
  return Cookies.get("token") || null;
}

function clearAdminSession() {
  Cookies.remove("token", { path: "/" });
  Cookies.remove("role", { path: "/" });
  Cookies.remove("is_admin", { path: "/" });
  Cookies.remove("admin_role_id", { path: "/" });
  Cookies.remove("user_name", { path: "/" });
  Cookies.remove("user_email", { path: "/" });

  try {
    clearTrustedDeviceCredential();
  } catch {}
}

function resetAdminCache() {
  cachedAdminToken = null;
  cachedAdminPayload = null;
  inFlightAdminPromise = null;
  inFlightAdminToken = null;
}

async function loadAdminMe(force = false) {
  const token = getToken();

  if (!token) {
    resetAdminCache();
    return {
      admin: null,
      permissions: [],
    };
  }

  const canUseCache =
    !force &&
    cachedAdminPayload &&
    cachedAdminToken &&
    cachedAdminToken === token;

  if (canUseCache) {
    return cachedAdminPayload;
  }

  const canUseInflight =
    !force &&
    inFlightAdminPromise &&
    inFlightAdminToken &&
    inFlightAdminToken === token;

  if (canUseInflight) {
    return inFlightAdminPromise;
  }

  inFlightAdminToken = token;

  inFlightAdminPromise = fetch(buildUrl("/admin/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));

      const details = String(json?.error?.details || "").toLowerCase();
      const shouldForceLogout =
        res.status === 401 ||
        (res.status === 403 &&
          (details.includes("admin role not assigned") ||
            details.includes("insufficient role")));

      if (shouldForceLogout) {
        clearAdminSession();
        throw new Error("Session expired");
      }

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.error?.message ||
            json?.message ||
            "Gagal mengambil admin me"
        );
      }

      const payload = {
        admin: json.data || null,
        permissions: Array.isArray(json.data?.permissions)
          ? json.data.permissions
          : [],
      };

      cachedAdminToken = token;
      cachedAdminPayload = payload;

      return payload;
    })
    .finally(() => {
      inFlightAdminPromise = null;
      inFlightAdminToken = null;
    });

  return inFlightAdminPromise;
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(cachedAdminPayload?.admin || null);
  const [permissions, setPermissions] = useState(
    cachedAdminPayload?.permissions || []
  );
  const [loading, setLoading] = useState(
    !(cachedAdminPayload && cachedAdminToken === getToken())
  );

  const applyPayload = useCallback((payload) => {
    setAdmin(payload?.admin || null);
    setPermissions(Array.isArray(payload?.permissions) ? payload.permissions : []);
  }, []);

  const refreshAdminAuth = useCallback(
    async ({ force = true, silent = false } = {}) => {
      const token = getToken();

      if (!token) {
        resetAdminCache();
        applyPayload({ admin: null, permissions: [] });
        setLoading(false);
        return { admin: null, permissions: [] };
      }

      try {
        if (!silent) setLoading(true);
        const payload = await loadAdminMe(force);
        applyPayload(payload);
        return payload;
      } catch (err) {
        applyPayload({ admin: null, permissions: [] });

        if (err?.message === "Session expired") {
          if (typeof window !== "undefined") {
            window.location.replace("/login");
          }
        }

        return { admin: null, permissions: [] };
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyPayload]
  );

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const token = getToken();

      if (!token) {
        resetAdminCache();
        if (!active) return;
        applyPayload({ admin: null, permissions: [] });
        setLoading(false);
        return;
      }

      const hasMatchingCache =
        cachedAdminPayload &&
        cachedAdminToken &&
        cachedAdminToken === token;

      if (hasMatchingCache) {
        if (!active) return;
        applyPayload(cachedAdminPayload);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const payload = await loadAdminMe(false);

        if (!active) return;

        applyPayload(payload);
      } catch (err) {
        if (!active) return;

        applyPayload({ admin: null, permissions: [] });

        if (err?.message === "Session expired") {
          if (typeof window !== "undefined") {
            window.location.replace("/login");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    boot();

    return () => {
      active = false;
    };
  }, [applyPayload]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const verifySession = () => {
      if (!getToken()) return;
      refreshAdminAuth({ force: true, silent: true }).catch(() => {});
    };

    const interval = window.setInterval(verifySession, 45000);
    window.addEventListener("focus", verifySession);
    window.addEventListener("visibilitychange", verifySession);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", verifySession);
      window.removeEventListener("visibilitychange", verifySession);
    };
  }, [refreshAdminAuth]);

  const can = useCallback(
    (key) => {
      if (!key) return true;
      if (admin?.is_super_admin) return true;
      return permissions.includes("*") || permissions.includes(key);
    },
    [permissions, admin]
  );

  const hasAdminFlag = useCallback(
    (flag) => {
      if (!flag) return true;
      if (admin?.is_super_admin) return true;
      return Boolean(admin?.[flag]);
    },
    [admin]
  );

  const value = useMemo(() => {
    return {
      admin,
      permissions,
      loading,
      can,
      hasAdminFlag,
      refreshAdminAuth,
    };
  }, [admin, permissions, loading, can, hasAdminFlag, refreshAdminAuth]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuthContext() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth harus digunakan di dalam AdminAuthProvider"
    );
  }

  return context;
}