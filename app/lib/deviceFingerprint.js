const FINGERPRINT_CACHE_KEY = "gt_device_fingerprint_v1"

function hasBrowserApi() {
  return typeof window !== "undefined" && typeof navigator !== "undefined"
}

function getCachedFingerprint() {
  if (!hasBrowserApi() || typeof window.localStorage === "undefined") return null

  try {
    const cached = window.localStorage.getItem(FINGERPRINT_CACHE_KEY)
    return cached || null
  } catch {
    return null
  }
}

function setCachedFingerprint(value) {
  if (!hasBrowserApi() || typeof window.localStorage === "undefined") return

  try {
    if (value) {
      window.localStorage.setItem(FINGERPRINT_CACHE_KEY, value)
    }
  } catch {}
}

function collectFingerprintSource() {
  if (!hasBrowserApi()) return "server"

  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown"
    } catch {
      return "unknown"
    }
  })()

  const screenInfo = typeof window.screen !== "undefined"
    ? [window.screen.width, window.screen.height, window.screen.colorDepth].join("x")
    : "no-screen"

  return [
    navigator.userAgent || "",
    navigator.language || "",
    Array.isArray(navigator.languages) ? navigator.languages.join(",") : "",
    navigator.platform || "",
    navigator.vendor || "",
    String(navigator.hardwareConcurrency || ""),
    String(navigator.maxTouchPoints || 0),
    timezone,
    screenInfo,
  ].join("||")
}

async function sha256Hex(input) {
  const value = String(input || "")

  if (
    typeof window !== "undefined" &&
    window.crypto?.subtle &&
    typeof TextEncoder !== "undefined"
  ) {
    const data = new TextEncoder().encode(value)
    const digest = await window.crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }

  return `fallback-${Math.abs(hash)}`
}

export async function getDeviceFingerprint() {
  const cached = getCachedFingerprint()
  if (cached) return cached

  const source = collectFingerprintSource()
  const hashed = await sha256Hex(source)
  setCachedFingerprint(hashed)
  return hashed
}