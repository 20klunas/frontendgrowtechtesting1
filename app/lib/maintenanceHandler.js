import Cookies from "js-cookie"

const REDIRECT_KEYS = new Set([
  "public_access",
])

const FEATURE_KEYS = new Set([
  "catalog_access",
  "checkout_access",
  "topup_access",
])

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
]

const AUTH_BYPASS_SESSION_KEY = "gt_allow_auth_navigation_until"

function readRoleCookie() {
  try {
    return (Cookies.get("role") || "").toLowerCase()
  } catch {
    return ""
  }
}

function readIsAdminCookie() {
  try {
    return String(Cookies.get("is_admin") || "").toLowerCase() === "true"
  } catch {
    return false
  }
}

function readAdminRoleIdCookie() {
  try {
    return Cookies.get("admin_role_id") || ""
  } catch {
    return ""
  }
}

function hasTokenCookie() {
  try {
    return Boolean(Cookies.get("token"))
  } catch {
    return false
  }
}

export function isAdminRole(role = "") {
  return String(role || "").toLowerCase() === "admin"
}

export function isAdminPath(pathname = "") {
  return String(pathname || "").startsWith("/admin")
}

export function isAuthRoute(pathname = "") {
  return AUTH_ROUTES.includes(pathname)
}

export function isAdminSession() {
  return hasTokenCookie() && (readIsAdminCookie() || (isAdminRole(readRoleCookie()) && !!readAdminRoleIdCookie()))
}

export function allowAuthNavigationOnce(ttlMs = 15000) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(AUTH_BYPASS_SESSION_KEY, String(Date.now() + ttlMs))
  } catch {}
}

export function consumeAuthNavigationAllowance() {
  if (typeof window === "undefined") return false
  try {
    const raw = sessionStorage.getItem(AUTH_BYPASS_SESSION_KEY)
    if (!raw) return false
    const expiresAt = Number(raw)
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      sessionStorage.removeItem(AUTH_BYPASS_SESSION_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

export function clearAuthNavigationAllowance() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(AUTH_BYPASS_SESSION_KEY)
  } catch {}
}

export function shouldBypassMaintenanceRedirect(pathname = "", key = "") {
  if (isAdminPath(pathname)) return true
  if (isAdminSession()) return true
  if (key === "public_access" && isAuthRoute(pathname)) return true
  if (key === "public_access" && consumeAuthNavigationAllowance()) return true
  return false
}

export function getMaintenanceMeta(data = {}) {
  return {
    isMaintenance: Boolean(data?.meta?.maintenance),
    scope: data?.meta?.scope || "system",
    key: data?.meta?.key || "maintenance",
    feature: data?.meta?.feature || null,
    message: data?.error?.message || data?.message || "System Maintenance",
  }
}

export function isRedirectMaintenanceKey(key) {
  return REDIRECT_KEYS.has(key)
}

export function isFeatureMaintenanceKey(key) {
  return FEATURE_KEYS.has(key)
}

export function getMaintenanceReturnUrl() {
  if (typeof window === "undefined") return "/"
  const pathname = window.location.pathname || "/"
  const search = window.location.search || ""
  const hash = window.location.hash || ""
  return `${pathname}${search}${hash}`
}

export function buildMaintenanceRedirectUrl(input) {
  const meta = input?.meta ? getMaintenanceMeta(input) : input

  const message = encodeURIComponent(meta?.message || "System Maintenance")
  const scope = encodeURIComponent(meta?.scope || "system")
  const key = encodeURIComponent(meta?.key || "maintenance")
  const next = encodeURIComponent(getMaintenanceReturnUrl())

  return `/maintenance?scope=${scope}&key=${key}&message=${message}&next=${next}`
}

export function createMaintenanceError(meta) {
  const err = new Error(meta?.message || "System Maintenance")
  err.name = "MaintenanceError"
  err.isMaintenance = true
  err.maintenance = meta
  return err
}

export function handleMaintenance(res, data) {
  if (res.status !== 503 || !data?.meta?.maintenance) {
    return
  }

  const meta = getMaintenanceMeta(data)
  const err = createMaintenanceError(meta)

  if (typeof window !== "undefined" && isRedirectMaintenanceKey(meta.key)) {
    const pathname = window.location.pathname || ""
    const target = buildMaintenanceRedirectUrl(meta)

    if (pathname.startsWith("/maintenance")) {
      throw err
    }

    if (shouldBypassMaintenanceRedirect(pathname, meta.key)) {
      throw err
    }

    const current = `${pathname}${window.location.search || ""}`
    if (current !== target) {
      window.location.replace(target)
    }
  }

  throw err
}

export function isMaintenanceError(error, key = null) {
  if (!error?.isMaintenance) return false
  if (!key) return true
  return error?.maintenance?.key === key
}

export function isFeatureMaintenanceError(error, key = null) {
  if (!error?.isMaintenance) return false
  if (!isFeatureMaintenanceKey(error?.maintenance?.key)) return false
  if (!key) return true
  return error?.maintenance?.key === key
}

export function getMaintenanceMessage(error, fallback = "Fitur sedang maintenance.") {
  return error?.maintenance?.message || error?.message || fallback
}
