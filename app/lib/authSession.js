import Cookies from 'js-cookie'

const AUTH_COOKIE_DAYS = 30
const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  expires: AUTH_COOKIE_DAYS,
}

export function isAdminUser(user = {}) {
  if (!user || typeof user !== 'object') return false

  if (user.is_admin === true) return true

  const role = String(user?.role || '').toLowerCase()
  const adminRoleId = user?.admin_role_id

  return role === 'admin' && adminRoleId !== null && adminRoleId !== undefined && adminRoleId !== ''
}

export function persistAuthSession(token, user = {}) {
  const isAdmin = isAdminUser(user)

  Cookies.set('token', token, COOKIE_OPTIONS)
  Cookies.set('role', user?.role || (isAdmin ? 'admin' : 'user'), COOKIE_OPTIONS)
  Cookies.set('user_name', user?.name || user?.full_name || '', COOKIE_OPTIONS)
  Cookies.set('user_email', user?.email || '', COOKIE_OPTIONS)
  Cookies.set('is_admin', isAdmin ? '1' : '0', COOKIE_OPTIONS)

  if (user?.admin_role_id !== null && user?.admin_role_id !== undefined && user?.admin_role_id !== '') {
    Cookies.set('admin_role_id', String(user.admin_role_id), COOKIE_OPTIONS)
  } else {
    Cookies.remove('admin_role_id', { path: '/' })
  }
}

export function clearAuthSession() {
  Cookies.remove('token', { path: '/' })
  Cookies.remove('role', { path: '/' })
  Cookies.remove('user_name', { path: '/' })
  Cookies.remove('user_email', { path: '/' })
  Cookies.remove('is_admin', { path: '/' })
  Cookies.remove('admin_role_id', { path: '/' })
}

export function resolvePostLoginPath(user = {}) {
  return isAdminUser(user) ? '/admin/dashboard' : '/customer'
}
