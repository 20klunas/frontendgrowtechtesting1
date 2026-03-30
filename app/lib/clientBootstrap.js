import { authFetch } from "./authFetch"

const CHECKOUT_BOOTSTRAP_KEY = "checkout-bootstrap-v4"
const CHECKOUT_BOOTSTRAP_TTL = 45 * 1000

let checkoutBootstrapMemory = null
let checkoutBootstrapExpiry = 0
let checkoutBootstrapPromise = null

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

function normalizeGateways(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return null
}

function normalizeWallet(value) {
  if (!value) return null
  if (value.wallet) return value
  if (value.data?.wallet) return value.data
  return value
}

function normalizeCheckout(value) {
  if (!value) return null
  if (Array.isArray(value?.items) || value?.summary || value?.order) return value
  if (Array.isArray(value?.data?.items) || value?.data?.summary || value?.data?.order) {
    return value.data
  }
  return null
}

export function normalizeCheckoutBootstrapData(source) {
  const root = source?.data || source || {}
  const checkout =
    normalizeCheckout(root.checkout) ||
    normalizeCheckout(root.cart_checkout) ||
    normalizeCheckout(root.checkout_preview) ||
    normalizeCheckout(root.preview) ||
    normalizeCheckout(root)

  const wallet =
    normalizeWallet(root.wallet) ||
    normalizeWallet(root.wallet_summary) ||
    normalizeWallet(root.wallets) ||
    null

  const gateways =
    normalizeGateways(root.gateways) ??
    normalizeGateways(root.payment_gateways) ??
    normalizeGateways(root.available_gateways) ??
    []

  return {
    checkout,
    wallet,
    gateways,
  }
}

function mergeBootstrapData(nextData) {
  const existing = readMemory() || null
  const normalized = normalizeCheckoutBootstrapData(nextData)

  return {
    checkout: normalized.checkout || existing?.checkout || null,
    wallet: normalized.wallet || existing?.wallet || null,
    gateways:
      Array.isArray(normalized.gateways) && normalized.gateways.length > 0
        ? normalized.gateways
        : existing?.gateways || [],
  }
}

function writeMemory(data) {
  checkoutBootstrapMemory = data
  checkoutBootstrapExpiry = Date.now() + CHECKOUT_BOOTSTRAP_TTL
}

function readMemory() {
  if (!checkoutBootstrapMemory) return null
  if (checkoutBootstrapExpiry <= Date.now()) {
    checkoutBootstrapMemory = null
    checkoutBootstrapExpiry = 0
    return null
  }
  return checkoutBootstrapMemory
}

export function readCheckoutBootstrapCache() {
  const memory = readMemory()
  if (memory) return memory
  if (!canUseSessionStorage()) return null

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_BOOTSTRAP_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(CHECKOUT_BOOTSTRAP_KEY)
      return null
    }

    const normalized = normalizeCheckoutBootstrapData(parsed.data)
    writeMemory(normalized)
    return normalized
  } catch {
    return null
  }
}

export function writeCheckoutBootstrapCache(data) {
  const merged = mergeBootstrapData(data)
  writeMemory(merged)

  if (!canUseSessionStorage()) return

  try {
    window.sessionStorage.setItem(
      CHECKOUT_BOOTSTRAP_KEY,
      JSON.stringify({
        data: merged,
        expiresAt: Date.now() + CHECKOUT_BOOTSTRAP_TTL,
      })
    )
  } catch {}
}

export function clearCheckoutBootstrapCache() {
  checkoutBootstrapMemory = null
  checkoutBootstrapExpiry = 0
  checkoutBootstrapPromise = null

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

  if (!force && checkoutBootstrapPromise) {
    return checkoutBootstrapPromise
  }

  checkoutBootstrapPromise = (async () => {
    const json = await authFetch("/api/v1/bootstrap/checkout", {
      cache: "no-store",
    })

    const normalized = normalizeCheckoutBootstrapData(json)
    writeCheckoutBootstrapCache(normalized)

    return {
      ...json,
      data: normalized,
    }
  })()

  try {
    return await checkoutBootstrapPromise
  } finally {
    checkoutBootstrapPromise = null
  }
}
