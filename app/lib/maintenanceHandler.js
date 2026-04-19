const REDIRECT_KEYS = new Set([
  "public_access",
  "user_area_access",
  "user_auth_access",
]);

const FEATURE_KEYS = new Set([
  "catalog_access",
  "checkout_access",
  "topup_access",
]);

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

export function getMaintenanceMeta(data = {}) {
  return {
    isMaintenance: Boolean(data?.meta?.maintenance),
    scope: data?.meta?.scope || "system",
    key: data?.meta?.key || "maintenance",
    feature: data?.meta?.feature || null,
    message:
      data?.error?.message ||
      data?.message ||
      "System Maintenance",
  };
}

export function isRedirectMaintenanceKey(key) {
  return REDIRECT_KEYS.has(key);
}

export function isFeatureMaintenanceKey(key) {
  return FEATURE_KEYS.has(key);
}

export function buildMaintenanceRedirectUrl(input) {
  const meta = input?.meta ? getMaintenanceMeta(input) : input;

  const message = encodeURIComponent(
    meta?.message || "System Maintenance"
  );

  const scope = encodeURIComponent(
    meta?.scope || "system"
  );

  const key = encodeURIComponent(
    meta?.key || "maintenance"
  );

  return `/maintenance?scope=${scope}&key=${key}&message=${message}`;
}

export function createMaintenanceError(meta) {
  const err = new Error(meta?.message || "System Maintenance");
  err.name = "MaintenanceError";
  err.isMaintenance = true;
  err.maintenance = meta;
  return err;
}

export function handleMaintenance(res, data) {
  if (res.status !== 503 || !data?.meta?.maintenance) {
    return;
  }

  const meta = getMaintenanceMeta(data);
  const err = createMaintenanceError(meta);

  if (
    typeof window !== "undefined" &&
    isRedirectMaintenanceKey(meta.key)
  ) {
    const pathname = window.location.pathname || "";
    const target = buildMaintenanceRedirectUrl(meta);

    if (pathname.startsWith("/maintenance")) {
      throw err;
    }

    // auth tetap boleh dibuka saat public maintenance
    if (meta.key === "public_access" && AUTH_ROUTES.includes(pathname)) {
      throw err;
    }

    const current = `${pathname}${window.location.search || ""}`;
    if (current !== target) {
      window.location.replace(target);
    }
  }

  throw err;
}

export function isMaintenanceError(error, key = null) {
  if (!error?.isMaintenance) return false;
  if (!key) return true;
  return error?.maintenance?.key === key;
}

export function isFeatureMaintenanceError(error, key = null) {
  if (!error?.isMaintenance) return false;
  if (!isFeatureMaintenanceKey(error?.maintenance?.key)) return false;
  if (!key) return true;
  return error?.maintenance?.key === key;
}

export function getMaintenanceMessage(error, fallback = "Fitur sedang maintenance.") {
  return (
    error?.maintenance?.message ||
    error?.message ||
    fallback
  );
}