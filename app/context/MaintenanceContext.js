"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Ganti path ini kalau endpoint public settings di backend kamu beda.
const PUBLIC_SETTINGS_PATH = "/content/settings?group=website";

function buildUrl(path) {
  if (!API) return `/api/v1${path}`;

  if (API.endsWith("/api/v1")) {
    return `${API}${path}`;
  }

  return `${API}/api/v1${path}`;
}

const DEFAULT_STATE = {
  fullMaintenance: false,
  fullMaintenanceMessage: "",
  catalogDisabled: false,
  catalogMessage: "",
  topupDisabled: false,
  topupMessage: "",
};

const MaintenanceContext = createContext(null);

MaintenanceContext.displayName = "MaintenanceContext";

// cache module-level supaya dev mode / strict mode tidak dobel fetch
let maintenanceCache = null;
let maintenancePromise = null;

function firstDefined(values) {
  return values.find((value) => value !== undefined && value !== null);
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on", "enabled", "active"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off", "disabled", "inactive"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function toText(value, fallback = "") {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function normalizeFeatureAccess(data) {
  const maintenanceNode = data?.maintenance || {};
  const featuresNode =
    maintenanceNode?.features ||
    data?.features ||
    data?.feature_access ||
    {};

  const fullMaintenance = toBoolean(
    firstDefined([
      maintenanceNode?.enabled,
      maintenanceNode?.active,
      data?.maintenance_enabled,
      data?.maintenance_mode,
      data?.is_maintenance,
      data?.site_maintenance,
    ]),
    false
  );

  const fullMaintenanceMessage = toText(
    firstDefined([
      maintenanceNode?.message,
      data?.maintenance_message,
      data?.site_maintenance_message,
    ]),
    "Website sedang maintenance."
  );

  function resolveFeature(key, defaultMessage) {
    const node = featuresNode?.[key] || data?.[key] || {};

    const disabledRaw = firstDefined([
      node?.disabled,
      node?.is_disabled,
      data?.[`${key}_disabled`],
      data?.[`${key}_access_disabled`],
    ]);

    const enabledRaw = firstDefined([
      node?.enabled,
      node?.is_enabled,
      node?.active,
      data?.[`${key}_enabled`],
      data?.[`${key}_access_enabled`],
    ]);

    const message = toText(
      firstDefined([
        node?.message,
        node?.maintenance_message,
        data?.[`${key}_message`],
        data?.[`${key}_maintenance_message`],
      ]),
      defaultMessage
    );

    let disabled = false;

    if (disabledRaw !== undefined) {
      disabled = toBoolean(disabledRaw, false);
    } else if (enabledRaw !== undefined) {
      disabled = !toBoolean(enabledRaw, true);
    }

    return {
      disabled,
      message,
    };
  }

  const catalog = resolveFeature(
    "catalog_access",
    "Katalog sedang maintenance."
  );

  const topup = resolveFeature(
    "topup_access",
    "Top up sedang maintenance."
  );

  return {
    fullMaintenance,
    fullMaintenanceMessage,
    catalogDisabled: fullMaintenance || catalog.disabled,
    catalogMessage: fullMaintenance
      ? fullMaintenanceMessage
      : catalog.disabled
      ? catalog.message
      : "",
    topupDisabled: fullMaintenance || topup.disabled,
    topupMessage: fullMaintenance
      ? fullMaintenanceMessage
      : topup.disabled
      ? topup.message
      : "",
  };
}

async function fetchFeatureAccess() {
  const res = await fetch(buildUrl(PUBLIC_SETTINGS_PATH), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 30 }, // cache 5 menit
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.success) {
    throw new Error(
      json?.error?.message ||
        json?.message ||
        "Gagal mengambil public settings"
    );
  }

  return normalizeFeatureAccess(json?.data || {});
}

export function MaintenanceProvider({ children }) {
  const [state, setState] = useState(maintenanceCache || DEFAULT_STATE);
  const [loading, setLoading] = useState(!maintenanceCache);

  const applyState = useCallback((nextState) => {
    setState({
      ...DEFAULT_STATE,
      ...nextState,
    });
  }, []);

  const hydrate = useCallback(
    async ({ force = false } = {}) => {
      if (!force && maintenanceCache) {
        applyState(maintenanceCache);
        setLoading(false);
        return maintenanceCache;
      }

      setLoading(true);

      try {
        if (!force && maintenancePromise) {
          const sharedResult = await maintenancePromise;
          applyState(sharedResult);
          return sharedResult;
        }

        maintenancePromise = fetchFeatureAccess();

        const snapshot = await maintenancePromise;

        maintenanceCache = snapshot;
        applyState(snapshot);

        return snapshot;
      } catch (err) {
        console.error("Feature access fetch failed:", err);

        maintenanceCache = { ...DEFAULT_STATE };
        applyState(maintenanceCache);

        return maintenanceCache;
      } finally {
        maintenancePromise = null;
        setLoading(false);
      }
    },
    [applyState]
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const refreshMaintenance = useCallback(async () => {
    return hydrate({ force: true });
  }, [hydrate]);

  const value = useMemo(
    () => ({
      ...state,
      loading,
      refreshMaintenance,
    }),
    [state, loading, refreshMaintenance]
  );

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);

  if (!context) {
    throw new Error("useMaintenance harus dipakai di dalam MaintenanceProvider");
  }

  return context;
}