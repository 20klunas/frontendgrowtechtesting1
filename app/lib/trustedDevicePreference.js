const REMEMBER_KEY = "gt_remember_trusted_device"
const CREDENTIAL_KEY = "gt_trusted_device_credential"
const EXPIRY_KEY = "gt_trusted_device_expires_at"

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function setTrustedDevicePreference(value) {
  if (!hasStorage()) return
  window.localStorage.setItem(REMEMBER_KEY, value ? "1" : "0")
}

export function getTrustedDevicePreference(defaultValue = true) {
  if (!hasStorage()) return defaultValue
  const value = window.localStorage.getItem(REMEMBER_KEY)
  if (value === "1") return true
  if (value === "0") return false
  return defaultValue
}

export function clearTrustedDevicePreference() {
  if (!hasStorage()) return
  window.localStorage.removeItem(REMEMBER_KEY)
}

export function saveTrustedDeviceCredential(credential, expiresAt = null) {
  if (!hasStorage()) return

  try {
    if (!credential) {
      window.localStorage.removeItem(CREDENTIAL_KEY)
      window.localStorage.removeItem(EXPIRY_KEY)
      return
    }

    window.localStorage.setItem(CREDENTIAL_KEY, String(credential))

    if (expiresAt) {
      window.localStorage.setItem(EXPIRY_KEY, String(expiresAt))
    } else {
      window.localStorage.removeItem(EXPIRY_KEY)
    }
  } catch {}
}

export function getTrustedDeviceCredential() {
  if (!hasStorage()) return null

  try {
    const credential = window.localStorage.getItem(CREDENTIAL_KEY)
    const expiresAt = window.localStorage.getItem(EXPIRY_KEY)

    if (!credential) return null

    if (expiresAt) {
      const ts = Date.parse(expiresAt)
      if (!Number.isNaN(ts) && ts <= Date.now()) {
        clearTrustedDeviceCredential()
        return null
      }
    }

    return credential
  } catch {
    return null
  }
}

export function clearTrustedDeviceCredential() {
  if (!hasStorage()) return

  try {
    window.localStorage.removeItem(CREDENTIAL_KEY)
    window.localStorage.removeItem(EXPIRY_KEY)
  } catch {}
}