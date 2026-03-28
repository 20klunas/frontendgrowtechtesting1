import Cookies from "js-cookie"
import { handleMaintenance } from "./maintenanceHandler"
import { buildApiUrl } from "./apiUrl"

// GLOBAL STATE (WAJIB DI LUAR)
const pendingRequests = new Map()
const responseCache = new Map()
const CACHE_TTL = 5000 // 5 detik cache
let isRedirecting = false

function resolveCacheMode(url, explicitCache) {
  if (explicitCache) return explicitCache

  const path = String(url || "").toLowerCase()

  const noStorePatterns = [
    /\/api\/v1\/cart\b/,
    /\/api\/v1\/wallet\b/,
    /\/api\/v1\/orders?\b/,
    /\/api\/v1\/payments?\b/,
    /\/api\/v1\/topups?\b/,
    /\/api\/v1\/withdraws?\b/,
    /\/api\/v1\/auth\/me\b/,
    /\/api\/v1\/profile\b/,
    /\/api\/v1\/admin\/me\b/,
    /\/api\/v1\/admin\/orders?\b/,
    /\/api\/v1\/admin\/transactions?\b/,
    /\/api\/v1\/admin\/wallet\b/,
    /\/api\/v1\/admin\/withdraws?\b/,
    /\/api\/v1\/admin\/audit-logs?\b/,
    /\/api\/v1\/admin\/logs?\b/,
  ]

  const cacheablePatterns = [
    /\/api\/v1\/products\b/,
    /\/api\/v1\/categories\b/,
    /\/api\/v1\/subcategories\b/,
    /\/api\/v1\/catalog\//,
    /\/api\/v1\/content\/settings\b/,
    /\/api\/v1\/content\/feature-access\b/,
    /\/api\/v1\/content\/banners?\b/,
    /\/api\/v1\/content\/popups?\b/,
    /\/api\/v1\/content\/faqs?\b/,
    /\/api\/v1\/content\/terms\b/,
    /\/api\/v1\/content\/privacy\b/,
  ]

  if (noStorePatterns.some((p) => p.test(path))) return "no-store"
  if (cacheablePatterns.some((p) => p.test(path))) return "force-cache"

  return "default"
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

export async function authFetch(url, options = {}) {
  const token = Cookies.get("token")

  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  const fullUrl = buildApiUrl(url)
  const cacheMode = resolveCacheMode(url, options.cache)

  // FIX BODY KEY (ANTI BUG)
  const bodyKey =
    typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body || "")

  const requestKey = `${options.method || "GET"}:${fullUrl}:${bodyKey}`

  // 1. CACHE HIT (SUPER CEPAT)
  if (responseCache.has(requestKey)) {
    const cached = responseCache.get(requestKey)
    if (Date.now() < cached.expiry) {
      return cached.data
    } else {
      responseCache.delete(requestKey)
    }
  }

  // 2. DEDUPE (ANTI SPAM REQUEST)
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const fetchPromise = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000) // 20s max

    try {
      const res = await fetch(fullUrl, {
        ...options,
        headers: buildHeaders(options, token),
        cache: cacheMode,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      // HANDLE 401 (ANTI LOOP REDIRECT)
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

      const contentType = res.headers.get("content-type")
      let data

      if (contentType?.includes("application/json")) {
        data = await res.json()
      } else {
        const text = await res.text()
        console.error("Non-JSON response:", text)
        throw new Error(`Invalid response (${res.status})`)
      }

      handleMaintenance(res, data)

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`)
      }

      responseCache.set(requestKey, {
        data,
        expiry: Date.now() + CACHE_TTL,
      })

      return data
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Request timeout (lebih dari 20 detik)")
      }
      throw err
    } finally {
      pendingRequests.delete(requestKey)
    }
  })()

  pendingRequests.set(requestKey, fetchPromise)

  return fetchPromise
}