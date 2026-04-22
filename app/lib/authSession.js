import Cookies from 'js-cookie'

const AUTH_COOKIE_DAYS = 30
const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  expires: AUTH_COOKIE_DAYS,
}

function toBooleanFlag(value) {
  return value === true || value === 1 || String(value || '').toLowerCase() === 'true'
}

export function persistAuthSession(token, user = {}) {
  const isAdmin = toBooleanFlag(user?.is_admin) || (String(user?.role || '').toLowerCase() === 'admin' && !!user?.admin_role_id)

  Cookies.set('token', token, COOKIE_OPTIONS)
  Cookies.set('role', user?.role || 'user', COOKIE_OPTIONS)
  Cookies.set('is_admin', String(isAdmin), COOKIE_OPTIONS)
  Cookies.set('admin_role_id', user?.admin_role_id ? String(user.admin_role_id) : '', COOKIE_OPTIONS)
  Cookies.set('user_name', user?.name || user?.full_name || '', COOKIE_OPTIONS)
  Cookies.set('user_email', user?.email || '', COOKIE_OPTIONS)
}

export function clearAuthSession() {
  Cookies.remove('token', { path: '/' })
  Cookies.remove('role', { path: '/' })
  Cookies.remove('is_admin', { path: '/' })
  Cookies.remove('admin_role_id', { path: '/' })
  Cookies.remove('user_name', { path: '/' })
  Cookies.remove('user_email', { path: '/' })
}

export function isAdminUser(user = {}) {
  return toBooleanFlag(user?.is_admin) || (String(user?.role || '').toLowerCase() === 'admin' && !!user?.admin_role_id)
}

export function resolvePostLoginPath(user = {}) {
  return isAdminUser(user) ? '/admin/dashboard' : '/customer'
}
