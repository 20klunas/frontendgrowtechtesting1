const KEY = "gt_remember_trusted_device"

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function setTrustedDevicePreference(value) {
  if (!hasStorage()) return
  window.localStorage.setItem(KEY, value ? "1" : "0")
}

export function getTrustedDevicePreference(defaultValue = true) {
  if (!hasStorage()) return defaultValue
  const value = window.localStorage.getItem(KEY)
  if (value === "1") return true
  if (value === "0") return false
  return defaultValue
}

export function clearTrustedDevicePreference() {
  if (!hasStorage()) return
  window.localStorage.removeItem(KEY)
}
