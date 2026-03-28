"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAppTransition } from "../hooks/useAppTransition";

export const AuthContext = createContext(null);

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const PROFILE_CACHE_TTL = 2 * 60 * 1000;
const PROFILE_STORAGE_KEY = "auth-me-profile-cache-v1";

let meCache = null;
let meCacheExpiry = 0;
let mePromise = null;
let meTokenCache = null;

function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API) {
    return normalizedPath;
  }

  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`;
  }

  return `${API}${normalizedPath}`;
}

function canUseSessionStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

function clearStoredProfile() {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {}
}

function clearProfileCache() {
  meCache = null;
  meCacheExpiry = 0;
  mePromise = null;
  meTokenCache = null;
  clearStoredProfile();
}

function persistProfile(token, profile) {
  meCache = profile || null;
  meTokenCache = token;
  meCacheExpiry = Date.now() + PROFILE_CACHE_TTL;

  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        token,
        expiresAt: meCacheExpiry,
        data: meCache,
      })
    );
  } catch {}
}

function readStoredProfile(token) {
  if (!token || !canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || parsed.token !== token) {
      clearStoredProfile();
      return null;
    }

    if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      clearStoredProfile();
      return null;
    }

    meCache = parsed.data || null;
    meTokenCache = token;
    meCacheExpiry = parsed.expiresAt;

    return meCache;
  } catch {
    clearStoredProfile();
    return null;
  }
}

function getCachedProfile(token) {
  if (!token) return null;

  if (meCache && meTokenCache === token && meCacheExpiry > Date.now()) {
    return meCache;
  }

  return readStoredProfile(token);
}

async function fetchMeProfile(token, { force = false } = {}) {
  if (!token) return null;

  const cached = !force ? getCachedProfile(token) : null;
  if (cached) {
    return cached;
  }

  if (!force && mePromise && meTokenCache === token) {
    return mePromise;
  }

  meTokenCache = token;

  mePromise = fetch(buildApiUrl("/api/v1/auth/me/profile"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    revalidate: 10,
  })
    .then(async (res) => {
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error?.message || json?.message || "Unauthorized");
      }

      persistProfile(token, json?.data || null);
      return meCache;
    })
    .finally(() => {
      mePromise = null;
    });

  return mePromise;
}

export function AuthProvider({ children, initialUser = null }) {
  const router = useRouter();
  const { isTransitioning } = useAppTransition();

  const transitionRef = useRef(isTransitioning);

  useEffect(() => {
    transitionRef.current = isTransitioning;
  }, [isTransitioning]);

  const initialResolvedUser = useMemo(() => {
    if (initialUser) return initialUser;

    if (typeof window === "undefined") return null;

    const token = Cookies.get("token") || null;
    return getCachedProfile(token);
  }, [initialUser]);

  const [actualUser, setActualUser] = useState(() => initialResolvedUser);
  const [displayUser, setDisplayUser] = useState(() => initialResolvedUser);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return false;

    const token = Cookies.get("token") || null;
    return Boolean(token) && !initialResolvedUser;
  });

  const applyUser = useCallback((nextUser, options = {}) => {
    const resolvedUser = nextUser || null;
    const shouldDisplay =
      typeof options.display === "boolean"
        ? options.display
        : !transitionRef.current;

    setActualUser((prev) => {
      if (prev === resolvedUser) return prev;
      return resolvedUser;
    });

    if (shouldDisplay) {
      setDisplayUser((prev) => {
        if (prev === resolvedUser) return prev;
        return resolvedUser;
      });
    }
  }, []);

  const syncProfile = useCallback(async ({ force = false, display } = {}) => {
    const token = Cookies.get("token") || null;
    const shouldDisplay =
      typeof display === "boolean" ? display : !transitionRef.current;

    if (!token) {
      clearProfileCache();
      applyUser(null, { display: true });
      setLoading(false);
      return null;
    }

    const cached = !force ? getCachedProfile(token) : null;
    if (cached) {
      applyUser(cached, { display: shouldDisplay });
      setLoading(false);
      return cached;
    }

    setLoading(true);

    try {
      const profile = await fetchMeProfile(token, { force });
      applyUser(profile, { display: shouldDisplay });
      return profile;
    } catch (error) {
      clearProfileCache();
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("user_name");
      Cookies.remove("user_email");
      applyUser(null, { display: true });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    if (initialUser) {
      applyUser(initialUser, { display: true });
      setLoading(false);
      return;
    }

    syncProfile().catch(() => {});
  }, [initialUser, applyUser, syncProfile]);

  useEffect(() => {
    if (!isTransitioning) {
      setDisplayUser((prev) => {
        if (prev === actualUser) return prev;
        return actualUser || null;
      });
    }
  }, [isTransitioning, actualUser]);

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== "visible") return;

      const token = Cookies.get("token") || null;
      if (token && !getCachedProfile(token)) {
        syncProfile().catch(() => {});
      }
    };

    const handleFocus = () => {
      const token = Cookies.get("token") || null;
      if (token && !getCachedProfile(token)) {
        syncProfile().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncProfile]);

  const logout = useCallback(async () => {
    const token = Cookies.get("token");

    try {
      if (token) {
        await fetch(buildApiUrl("/api/v1/auth/logout"), {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          revalidate: 10,
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    }

    clearProfileCache();
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("user_name");
    Cookies.remove("user_email");

    applyUser(null, { display: true });
    setLoading(false);
    router.push("/login");
  }, [applyUser, router]);

  const refreshUser = useCallback(() => {
    return syncProfile({ force: true, display: !transitionRef.current });
  }, [syncProfile]);

  const setUser = useCallback((nextUser, options = {}) => {
    applyUser(nextUser, options);
  }, [applyUser]);

  const value = useMemo(
    () => ({
      user: displayUser,
      actualUser,
      setUser,
      loading,
      logout,
      refreshUser,
    }),
    [displayUser, actualUser, setUser, loading, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}