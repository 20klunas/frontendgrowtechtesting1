import Cookies from "js-cookie"
import { buildApiUrl } from "./apiUrl"
import { handleMaintenance } from "./maintenanceHandler"

const pendingRequests = new Map()
const responseCache = new Map()
const DEFAULT_TIMEOUT_MS = 45000

const TTL = {
  SHORT: 10000,
  MEDIUM: 30000,
  LONG: 60000,
}

function normalizeMethod(method) {
  return String(method || "GET").toUpperCase()
}

function isMutation(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method)
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

function getTTL(url) {
  const path = String(url || "").toLowerCase()

  if (path.includes("/payment-gateways/available")) return TTL.SHORT

  return TTL.SHORT
}

function shouldCache(url, method) {
  if (method !== "GET") return false

  const path = String(url || "").toLowerCase()

  if (
    path.includes("/products?") ||
    path.includes("/content/pages/") ||
    path.includes("/catalog/categories") ||
    path.includes("/catalog/subcategories") ||
    path.includes("/categories") ||
    path.includes("/subcategories")
  ) {
    return false
  }

  return [
    "/payment-gateways/available",
  ].some((part) => path.includes(part))
}

function buildHeaders(options, token) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  }
}

function safeStringify(body) {
  if (!body) return ""
  if (typeof body === "string") return body
  if (typeof FormData !== "undefined" && body instanceof FormData) return "formdata"

  try {
    return JSON.stringify(body)
  } catch {
    return "invalid"
  }
}

function getRequestKey(fullUrl, method, body, token) {
  return `${token || "guest"}:${method}:${normalizeUrl(fullUrl)}:${safeStringify(body)}`
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

function clearByMatcher(matcher) {
  for (const key of Array.from(responseCache.keys())) {
    if (matcher(key)) {
      responseCache.delete(key)
    }
  }

  for (const key of Array.from(pendingRequests.keys())) {
    if (matcher(key)) {
      pendingRequests.delete(key)
    }
  }
}

export function invalidateFetcherCache(patterns = []) {
  clearByMatcher(buildMatcher(patterns))
}

function clearVolatileCaches() {
  invalidateFetcherCache([
    "/api/v1/cart",
    "/api/v1/wallet",
    "/api/v1/orders",
    "/api/v1/bootstrap/checkout",
    "/api/v1/payment-gateways/available",
    "/api/v1/favorites",
  ])
}

export async function fetcher(url, options = {}, config = {}) {
  const method = normalizeMethod(options.method)
  const fullUrl = buildApiUrl(url)

  const token = Cookies.get("token")
  const requireAuth = config.auth ?? false
  const force = config.force ?? false

  if (requireAuth && !token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  const requestKey = getRequestKey(fullUrl, method, options.body, token)
  const canCache = shouldCache(url, method)

  if (canCache && responseCache.has(requestKey)) {
    const cached = responseCache.get(requestKey)
    if (cached.exp > Date.now()) return cached.data
    responseCache.delete(requestKey)
  }

  if (!force && method === "GET" && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const promise = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
      const res = await fetch(fullUrl, {
        ...options,
        method,
        headers: buildHeaders(options, token),
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      })

      let data = null
      const contentType = res.headers.get("content-type") || ""

      if (contentType.includes("application/json")) {
        data = await res.json()
      } else {
        const text = await res.text()
        console.error("Non JSON:", text)
        throw new Error("Response bukan JSON")
      }

      handleMaintenance(res, data)

      if (res.status === 401) {
        Cookies.remove("token")
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Session expired")
      }

      if (!res.ok) {
        const apiMessage =
          data?.error?.message ||
          data?.message ||
          `HTTP ${res.status}`

        const error = new Error(apiMessage)
        error.status = res.status
        error.data = data
        error.details = data?.error?.details ?? null
        throw error
      }

      if (canCache) {
        responseCache.set(requestKey, {
          data,
          exp: Date.now() + getTTL(url),
        })
      }

      if (isMutation(method)) {
        clearVolatileCaches()
      }

      return data
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error("Timeout >45s")
      }
      throw err
    } finally {
      clearTimeout(timeout)
      pendingRequests.delete(requestKey)
    }
  })()

  if (method === "GET") {
    pendingRequests.set(requestKey, promise)
  }

  return promise
}