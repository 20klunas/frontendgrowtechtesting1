import { buildApiUrl } from "./apiUrl"
import { cookies } from "next/headers"

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function buildCacheOptions(options = {}) {
  const { cache, next } = options

  if (cache === "no-store") {
    return { cache: "no-store" }
  }

  if (next) {
    return { next }
  }

  return { cache: "no-store" }
}

async function doServerFetch(path, options = {}, token = "") {
  const { headers = {}, method = "GET", ...rest } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(buildApiUrl(path), {
      method,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...buildCacheOptions(options),
      ...rest,
      signal: controller.signal,
    })

    const payload = await parseJsonSafe(response)

    if (!response.ok) {
      const error = new Error(payload?.message || `Fetch failed with status ${response.status}`)
      error.status = response.status
      error.payload = payload
      throw error
    }

    return payload
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function serverPublicFetch(path, options = {}) {
  return doServerFetch(path, options, "")
}

export async function serverAuthFetch(path, options = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value || ""

  return doServerFetch(path, options, token)
}

// Backward-compatible default for existing public catalog/product usage.
export const serverFetch = serverPublicFetch
