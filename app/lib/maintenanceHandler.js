import Cookies from 'js-cookie'

const REDIRECT_KEYS = new Set([
  'public_access',
  'user_area_access',
])

const FEATURE_KEYS = new Set([
  'catalog_access',
  'checkout_access',
  'topup_access',
])

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
]

function readCookie(name) {
  try {
    return Cookies.get(name) || ''
  } catch {
    return ''
  }
}

function hasTokenCookie() {
  return Boolean(readCookie('token'))
}

export function isAdminRole(role = '') {
  return String(role || '').toLowerCase() === 'admin'
}

export function isAdminUserShape(user = {}) {
  if (!user || typeof user !== 'object') return false
  if (user.is_admin === true) return true

  return isAdminRole(user.role) && user.admin_role_id !== null && user.admin_role_id !== undefined && user.admin_role_id !== ''
}

export function isAdminPath(pathname = '') {
  return String(pathname || '').startsWith('/admin')
}

export function isAuthRoute(pathname = '') {
  return AUTH_ROUTES.includes(pathname)
}

export function isAdminSession() {
  if (!hasTokenCookie()) return false

  const explicitFlag = readCookie('is_admin')
  if (explicitFlag === '1') return true

  const role = readCookie('role')
  const adminRoleId = readCookie('admin_role_id')

  return isAdminRole(role) && adminRoleId !== ''
}

export function shouldBypassMaintenanceRedirect(pathname = '', key = '') {
  if (isAdminPath(pathname)) {
    return true
  }

  if (isAdminSession()) {
    return true
  }

  // halaman auth publik harus tetap bisa dibuka supaya admin/customer masih bisa melihat form.
  // pembatasan customer auth tetap dilakukan oleh response 503 dari backend.
  if (key === 'public_access' && isAuthRoute(pathname)) {
    return true
  }

  return false
}

export function getMaintenanceMeta(data = {}) {
  return {
    isMaintenance: Boolean(data?.meta?.maintenance),
    scope: data?.meta?.scope || 'system',
    key: data?.meta?.key || 'maintenance',
    feature: data?.meta?.feature || null,
    message: data?.error?.message || data?.message || 'System Maintenance',
  }
}

export function isRedirectMaintenanceKey(key) {
  return REDIRECT_KEYS.has(key)
}

export function isFeatureMaintenanceKey(key) {
  return FEATURE_KEYS.has(key)
}

export function getMaintenanceReturnUrl() {
  if (typeof window === 'undefined') return '/'
  const pathname = window.location.pathname || '/'
  const search = window.location.search || ''
  const hash = window.location.hash || ''
  return `${pathname}${search}${hash}`
}

export function buildMaintenanceRedirectUrl(input) {
  const meta = input?.meta ? getMaintenanceMeta(input) : input

  const message = encodeURIComponent(meta?.message || 'System Maintenance')
  const scope = encodeURIComponent(meta?.scope || 'system')
  const key = encodeURIComponent(meta?.key || 'maintenance')
  const next = encodeURIComponent(getMaintenanceReturnUrl())

  return `/maintenance?scope=${scope}&key=${key}&message=${message}&next=${next}`
}

export function createMaintenanceError(meta) {
  const err = new Error(meta?.message || 'System Maintenance')
  err.name = 'MaintenanceError'
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

  if (typeof window !== 'undefined' && isRedirectMaintenanceKey(meta.key)) {
    const pathname = window.location.pathname || ''
    const target = buildMaintenanceRedirectUrl(meta)

    if (pathname.startsWith('/maintenance')) {
      throw err
    }

    if (shouldBypassMaintenanceRedirect(pathname, meta.key)) {
      throw err
    }

    const current = `${pathname}${window.location.search || ''}`
    if (current !== target) {
      window.location.replace(target)
      return
    }
  }

  // user_auth_access sengaja tidak redirect global.
  // Customer akan menerima popup error dari form login,
  // sementara admin masih bisa login dari halaman yang sama.
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

export function getMaintenanceMessage(error, fallback = 'Fitur sedang maintenance.') {
  return error?.maintenance?.message || error?.message || fallback
}
