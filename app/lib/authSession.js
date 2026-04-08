import Cookies from 'js-cookie'

const AUTH_COOKIE_DAYS = 30
const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  expires: AUTH_COOKIE_DAYS,
}

export function persistAuthSession(token, user = {}) {
  Cookies.set('token', token, COOKIE_OPTIONS)
  Cookies.set('role', user?.role || 'user', COOKIE_OPTIONS)
  Cookies.set('user_name', user?.name || user?.full_name || '', COOKIE_OPTIONS)
  Cookies.set('user_email', user?.email || '', COOKIE_OPTIONS)
}

export function clearAuthSession() {
  Cookies.remove('token', { path: '/' })
  Cookies.remove('role', { path: '/' })
  Cookies.remove('user_name', { path: '/' })
  Cookies.remove('user_email', { path: '/' })
}

export function resolvePostLoginPath(user = {}) {
  return user?.role === 'admin' ? '/admin/dashboard' : '/customer'
}
