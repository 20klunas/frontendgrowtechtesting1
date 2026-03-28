import Cookies from 'js-cookie'

export function persistAuthSession(token, user = {}) {
  Cookies.set('token', token, {
    path: '/',
    sameSite: 'lax',
  })

  Cookies.set('role', user?.role || 'user', {
    path: '/',
    sameSite: 'lax',
  })

  Cookies.set('user_name', user?.name || user?.full_name || '', {
    path: '/',
    sameSite: 'lax',
  })

  Cookies.set('user_email', user?.email || '', {
    path: '/',
    sameSite: 'lax',
  })
}

export function clearAuthSession() {
  Cookies.remove('token')
  Cookies.remove('role')
  Cookies.remove('user_name')
  Cookies.remove('user_email')
}

export function resolvePostLoginPath(user = {}) {
  return user?.role === 'admin' ? '/admin/dashboard' : '/customer'
}