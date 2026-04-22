import { handleMaintenance } from "./maintenanceHandler"
import { buildApiUrl } from "./apiUrl"
import { getDeviceFingerprint } from "./deviceFingerprint"
import { getTrustedDeviceCredential } from "./trustedDevicePreference"

const pendingRequests = new Map()
const responseCache = new Map()
const DEFAULT_TTL = 30000
const LONG_TTL = 60000

function normalizeMethod(method) {
  return String(method || "GET").toUpperCase()
}

function resolveCacheMode(url, explicitCache, method = "GET") {
  if (explicitCache) return explicitCache

  const path = String(url || "").toLowerCase()
  const safeMethod = normalizeMethod(method)

  if (safeMethod !== "GET") {
    return "no-store"
  }

  if (
    /\/api\/v1\/content\/settings\b/.test(path) ||
    /\/api\/v1\/content\/feature-access\b/.test(path)
  ) {
    return "no-store"
  }

  const cacheablePatterns = [
    /\/api\/v1\/products\b/,
    /\/api\/v1\/catalog\/products\b/,
    /\/api\/v1\/content\/banners?\b/,
    /\/api\/v1\/content\/popups?\b/,
    /\/api\/v1\/content\/faqs?\b/,
    /\/api\/v1\/content\/terms\b/,
    /\/api\/v1\/content\/privacy\b/,
    /\/api\/v1\/content\/pages?\b/,
  ]

  if (cacheablePatterns.some((pattern) => pattern.test(path))) {
    return "default"
  }

  return "no-store"
}

function shouldUseMemoryCache(url, method = "GET") {
  const path = String(url || "").toLowerCase()
  const safeMethod = normalizeMethod(method)

  if (safeMethod !== "GET") return false

  if (
    /\/api\/v1\/content\/settings\b/.test(path) ||
    /\/api\/v1\/content\/feature-access\b/.test(path)
  ) {
    return false
  }

  return [
    /\/api\/v1\/products\b/,
    /\/api\/v1\/catalog\/products\b/,
    /\/api\/v1\/content\//,
  ].some((pattern) => pattern.test(path))
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

function clearPendingRequestsByMatcher(matcher) {
  for (const key of Array.from(pendingRequests.keys())) {
    if (matcher(key)) {
      pendingRequests.delete(key)
    }
  }
}

function clearResponseCacheByMatcher(matcher) {
  for (const key of Array.from(responseCache.keys())) {
    if (matcher(key)) {
      responseCache.delete(key)
    }
  }
}

export function invalidatePublicFetchCache(patterns = []) {
  const matcher = buildMatcher(patterns)
  clearResponseCacheByMatcher(matcher)
  clearPendingRequestsByMatcher(matcher)
}

function getCacheTTL(url) {
  const path = String(url || "").toLowerCase()

  if (/\/api\/v1\/content\//.test(path)) {
    return LONG_TTL
  }

  return DEFAULT_TTL
}

async function buildTrustedDeviceHeaders() {
  const headers = {}

  try {
    const fingerprint = await getDeviceFingerprint()
    if (fingerprint) {
      headers["X-Device-Fingerprint"] = fingerprint
    }
  } catch {}

  try {
    const credential = getTrustedDeviceCredential()
    if (credential) {
      headers["X-Trusted-Device"] = credential
    }
  } catch {}

  return headers
}

async function buildHeaders(options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  const trustedHeaders = await buildTrustedDeviceHeaders()

  return {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...trustedHeaders,
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

export async function publicFetch(url, options = {}) {
  const method = normalizeMethod(options.method)
  const cacheMode = resolveCacheMode(url, options.cache, method)
  const fullUrl = buildApiUrl(url)
  const requestKey = `${method}:${fullUrl}:${buildBodyKey(options.body)}`
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
    const timeout = setTimeout(() => controller.abort(), 100000)

    try {
      const res = await fetch(fullUrl, {
        ...options,
        method,
        headers: await buildHeaders(options),
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
        throw new Error(`Server bukan JSON (HTTP ${res.status})`)
      }

      handleMaintenance(res, data)

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || `HTTP ${res.status}`)
      }

      if (canUseMemoryCache) {
        responseCache.set(requestKey, {
          data,
          expiresAt: Date.now() + getCacheTTL(url),
        })
      }

      return data
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error("Request timeout (lebih dari 100 detik)")
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