import Cookies from "js-cookie"
import { clearTrustedDeviceCredential } from "./trustedDevicePreference"

let authRedirecting = false

export function cn(...classes) {
  return classes
    .flatMap((cls) => {
      if (!cls) return []
      if (typeof cls === "string") return cls
      if (typeof cls === "object")
        return Object.entries(cls)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
      return []
    })
    .join(" ")
}


function clearClientSession() {
  Cookies.remove("token", { path: "/" })
  Cookies.remove("role", { path: "/" })
  Cookies.remove("is_admin", { path: "/" })
  Cookies.remove("admin_role_id", { path: "/" })
  Cookies.remove("user_name", { path: "/" })
  Cookies.remove("user_email", { path: "/" })

  try {
    clearTrustedDeviceCredential()
  } catch {}
}

function shouldForceLogout(url, status, data) {
  const path = String(url || "").toLowerCase()
  const details = String(data?.error?.details || "").toLowerCase()

  if (status === 401) return true

  if (!path.includes("/api/v1/admin")) return false

  return status === 403 && (
    details.includes("admin role not assigned") ||
    details.includes("insufficient role")
  )
}

function forceLogoutToLogin() {
  if (authRedirecting) return

  authRedirecting = true
  clearClientSession()

  if (typeof window !== "undefined") {
    window.location.replace("/login")
  }
}

export async function apiFetch(url, options = {}) {
  const token = Cookies.get("token")

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    {
      ...options,
      cache: "no-store",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }
  )

  let data
  const text = await res.text()

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (shouldForceLogout(url, res.status, data)) {
    forceLogoutToLogin()
    const error = new Error("Session admin berakhir. Silakan login ulang.")
    error.status = res.status
    error.data = data
    error.details = data?.error?.details ?? data?.errors ?? null
    throw error
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    error.details = data?.error?.details ?? data?.errors ?? null
    throw error
  }

  return data
}
