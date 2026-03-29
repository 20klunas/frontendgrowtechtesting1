// lib/fetcher.js
import Cookies from "js-cookie"
import { buildApiUrl } from "./apiUrl"
import { handleMaintenance } from "./maintenanceHandler"

const pendingRequests = new Map()
const responseCache = new Map()

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
  const u = new URL(url, "http://dummy")
  u.searchParams.sort()
  return u.pathname + u.search
}

function getTTL(url) {
  const path = url.toLowerCase()

  if (path.includes("/content")) return TTL.LONG
  if (path.includes("/categories")) return TTL.MEDIUM
  if (path.includes("/products")) return TTL.SHORT

  return TTL.SHORT
}

function shouldCache(url, method) {
  if (method !== "GET") return false

  return [
    "/products",
    "/categories",
    "/subcategories",
    "/catalog",
    "/content",
  ].some((p) => url.toLowerCase().includes(p))
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
  if (body instanceof FormData) return "formdata"

  try {
    return JSON.stringify(body)
  } catch {
    return "invalid"
  }
}

function getRequestKey(fullUrl, method, body) {
  return `${method}:${normalizeUrl(fullUrl)}:${safeStringify(body)}`
}

function clearCache() {
  responseCache.clear()
  pendingRequests.clear()
}

export async function fetcher(url, options = {}, config = {}) {
  const method = normalizeMethod(options.method)
  const fullUrl = buildApiUrl(url)

  const token = Cookies.get("token")
  const requireAuth = config.auth ?? false

  if (requireAuth && !token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  const requestKey = getRequestKey(fullUrl, method, options.body)
  const canCache = shouldCache(url, method)

  if (canCache && responseCache.has(requestKey)) {
    const cached = responseCache.get(requestKey)
    if (cached.exp > Date.now()) return cached.data
    responseCache.delete(requestKey)
  }

  if (method === "GET" && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const promise = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 100000)

    try {
      const res = await fetch(fullUrl, {
        ...options,
        method,
        headers: buildHeaders(options, token),
        cache: "no-store",
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

      // 🔥 AUTO HANDLE 401
      if (res.status === 401) {
        Cookies.remove("token")
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Session expired")
      }

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`)
      }

      if (canCache) {
        responseCache.set(requestKey, {
          data,
          exp: Date.now() + getTTL(url),
        })
      }

      if (isMutation(method)) {
        clearCache()
      }

      return data
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Timeout >10s")
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