import { authFetch } from "./authFetch"

const CHECKOUT_BOOTSTRAP_KEY = "checkout-bootstrap-v2"
const CHECKOUT_BOOTSTRAP_TTL = 30 * 1000

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

export function readCheckoutBootstrapCache() {
  if (!canUseSessionStorage()) return null

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_BOOTSTRAP_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(CHECKOUT_BOOTSTRAP_KEY)
      return null
    }

    return parsed.data || null
  } catch {
    return null
  }
}

export function writeCheckoutBootstrapCache(data) {
  if (!canUseSessionStorage()) return

  try {
    window.sessionStorage.setItem(
      CHECKOUT_BOOTSTRAP_KEY,
      JSON.stringify({
        data,
        expiresAt: Date.now() + CHECKOUT_BOOTSTRAP_TTL,
      })
    )
  } catch {}
}

export function clearCheckoutBootstrapCache() {
  if (!canUseSessionStorage()) return

  try {
    window.sessionStorage.removeItem(CHECKOUT_BOOTSTRAP_KEY)
  } catch {}
}

export async function getCheckoutBootstrap({ force = false } = {}) {
  if (!force) {
    const cached = readCheckoutBootstrapCache()
    if (cached) {
      return {
        success: true,
        data: cached,
        meta: { source: "session" },
      }
    }
  }

  const json = await authFetch("/api/v1/bootstrap/checkout", {
    cache: "no-store",
  })

  if (json?.success && json?.data) {
    writeCheckoutBootstrapCache(json.data)
  }

  return json
}
