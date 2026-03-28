import { handleMaintenance } from "./maintenanceHandler"

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

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
    /\/api\/v1\/admin\//,

    /\/api\/v1\/products\b/,
    /\/api\/v1\/categories\b/,
    /\/api\/v1\/subcategories\b/,
    /\/api\/v1\/catalog\//,
  ]

  const cacheablePatterns = [
    /\/api\/v1\/content\/settings\b/,
    /\/api\/v1\/content\/banners?\b/,
    /\/api\/v1\/content\/popups?\b/,
    /\/api\/v1\/content\/faqs?\b/,
    /\/api\/v1\/content\/terms\b/,
    /\/api\/v1\/content\/privacy\b/,
    /\/api\/v1\/content\/pages?\b/,
  ]

  if (noStorePatterns.some((pattern) => pattern.test(path))) {
    return "no-store"
  }

  if (cacheablePatterns.some((pattern) => pattern.test(path))) {
    return "force-cache"
  }

  if (path.startsWith("/api/")) {
    return "no-cache"
  }

  return "default"
}

function buildHeaders(options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  return {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  }
}

export async function publicFetch(url, options = {}) {
  const cacheMode = resolveCacheMode(url, options.cache)

  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: buildHeaders(options),
    cache: cacheMode,
  })

  const contentType = res.headers.get("content-type")
  let data = null

  if (contentType && contentType.includes("application/json")) {
    data = await res.json()
  } else {
    const text = await res.text()
    console.error("Non-JSON response:", text)
    throw new Error(`Server mengembalikan bukan JSON (HTTP ${res.status})`)
  }

  handleMaintenance(res, data)

  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `HTTP ${res.status}`
    )
  }

  return data
}