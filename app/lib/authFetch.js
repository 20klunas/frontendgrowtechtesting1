import Cookies from "js-cookie"
import { handleMaintenance } from "./maintenanceHandler"
import { buildApiUrl } from "./apiUrl"

const pendingRequests = new Map()
const responseCache = new Map()
const DEFAULT_TTL = 15000
const CATALOG_TTL = 60000
const DEFAULT_TIMEOUT_MS = 45000
let isRedirecting = false

function normalizeMethod(method) {
  return String(method || "GET").toUpperCase()
}

function isMutationMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(normalizeMethod(method))
}

function normalizeUrl(url) {
  try {
    const target = new URL(url, "http://localhost")
    target.searchParams.sort()
    return `${target.pathname}${target.search}`
  } catch {
    return String(url || "")
  }
}

function resolveCacheMode(url, explicitCache, method = "GET") {
  if (explicitCache) return explicitCache

  const path = String(url || "").toLowerCase()
  const safeMethod = normalizeMethod(method)

  if (safeMethod !== "GET") {
    return "no-store"
  }

  const noStorePatterns = [
    /\/api\/v1\/cart\b/,
    /\/api\/v1\/wallet\b/,
    /\/api\/v1\/orders?\b/,
    /\/api\/v1\/payments?\b/,
    /\/api\/v1\/topups?\b/,
    /\/api\/v1\/withdraws?\b/,
    /\/api\/v1\/auth\/me\b/,
    /\/api\/v1\/profile\b/,
    /\/api\/v1\/admin\//,
    /\/api\/v1\/bootstrap\/checkout\b/,
    /\/api\/v1\/bootstrap\/orders\//,
  ]

  if (noStorePatterns.some((pattern) => pattern.test(path))) {
    return "no-store"
  }

  return "default"
}

function shouldUseMemoryCache(url, method = "GET") {
  const path = String(url || "").toLowerCase()
  const safeMethod = normalizeMethod(method)

  if (safeMethod !== "GET") return false

  const cacheablePatterns = [
    /\/api\/v1\/payment-gateways\/available\b/,
    /\/api\/v1\/content\//,
    /\/api\/v1\/catalog\//,
    /\/api\/v1\/categories\b/,
    /\/api\/v1\/subcategories\b/,
    /\/api\/v1\/products\b/,
    /\/api\/v1\/bootstrap\/shell\b/,
  ]

  return cacheablePatterns.some((pattern) => pattern.test(path))
}

function getCacheTTL(url) {
  const path = String(url || "").toLowerCase()

  if (
    /\/api\/v1\/catalog\//.test(path) ||
    /\/api\/v1\/products\b/.test(path) ||
    /\/api\/v1\/subcategories\b/.test(path) ||
    /\/api\/v1\/categories\b/.test(path)
  ) {
    return CATALOG_TTL
  }

  return DEFAULT_TTL
}

function buildHeaders(options = {}, token) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  }
}

function buildBodyKey(body) {
  if (typeof body === "string") return body
  if (body == null) return ""

  try {
    return JSON.stringify(body)
  } catch {
    return String(body)
  }
}

function buildRequestKey(fullUrl, options = {}) {
  const method = normalizeMethod(options.method)
  const bodyKey = buildBodyKey(options.body)
  return `${method}:${normalizeUrl(fullUrl)}:${bodyKey}`
}

function clearPendingRequestsByMatcher(matcher) {
  for (const [key] of Array.from(pendingRequests.entries())) {
    if (matcher(key)) {
      pendingRequests.delete(key)
    }
  }
}

function clearResponseCacheByMatcher(matcher) {
  for (const [key] of Array.from(responseCache.entries())) {
    if (matcher(key)) {
      responseCache.delete(key)
    }
  }
}

function buildMatcher(patterns = []) {
  const safePatterns = Array.isArray(patterns) ? patterns : [patterns]

  return (key) =>
    safePatterns.some((pattern) => {
      if (!pattern) return false
      if (typeof pattern === "function") return Boolean(pattern(key))
      if (pattern instanceof RegExp) return pattern.test(key)
      return key.includes(String(pattern))
    })
}

export function invalidateAuthFetchCache(patterns = []) {
  const matcher = buildMatcher(patterns)
  clearResponseCacheByMatcher(matcher)
  clearPendingRequestsByMatcher(matcher)
}

function clearVolatileCaches() {
  invalidateAuthFetchCache([
    "/api/v1/cart",
    "/api/v1/wallet",
    "/api/v1/orders",
    "/api/v1/bootstrap/checkout",
    "/api/v1/payment-gateways/available",
    "/api/v1/favorites",
  ])
}

export async function authFetch(url, options = {}) {
  const token = Cookies.get("token")

  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  const method = normalizeMethod(options.method)
  const fullUrl = buildApiUrl(url)
  const cacheMode = resolveCacheMode(url, options.cache, method)
  const requestKey = buildRequestKey(fullUrl, { ...options, method })
  const canUseMemoryCache = shouldUseMemoryCache(url, method)

  if (canUseMemoryCache && responseCache.has(requestKey)) {
    const cached = responseCache.get(requestKey)
    if (cached.expiresAt > Date.now()) {
      return cached.data
    }
    responseCache.delete(requestKey)
  }

  if (method === "GET" && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const fetchPromise = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
      const res = await fetch(fullUrl, {
        ...options,
        method,
        headers: buildHeaders(options, token),
        cache: cacheMode,
        credentials: "include",
        signal: controller.signal,
      })

      const contentType = res.headers.get("content-type") || ""
      let data = null

      if (contentType.includes("application/json")) {
        data = await res.json()
      } else {
        const text = await res.text()
        console.error("Non-JSON response:", text)
        throw new Error(`Invalid response (${res.status})`)
      }

      handleMaintenance(res, data)

      if (res.status === 401 && !isRedirecting) {
        isRedirecting = true
        Cookies.remove("token")
        Cookies.remove("role")
        Cookies.remove("user_name")
        Cookies.remove("user_email")

        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }

        throw new Error("Session expired")
      }

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || `HTTP ${res.status}`)
      }

      if (canUseMemoryCache) {
        responseCache.set(requestKey, {
          data,
          expiresAt: Date.now() + getCacheTTL(url),
        })
      }

      if (isMutationMethod(method)) {
        clearVolatileCaches()
      }

      return data
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error("Request timeout (lebih dari 45 detik)")
      }
      throw err
    } finally {
      clearTimeout(timeout)
      pendingRequests.delete(requestKey)
    }
  })()

  if (method === "GET") {
    pendingRequests.set(requestKey, fetchPromise)
  }

  return fetchPromise
}
