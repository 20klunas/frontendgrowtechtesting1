import { buildApiUrl } from "./apiUrl"

export async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export function getErrorMessage(payload, fallback) {
  return (
    payload?.message ||
    payload?.error?.message ||
    payload?.meta?.message ||
    payload?.data?.message ||
    fallback
  )
}

export async function serverFetchJson(path, options = {}) {
  const {
    cache = "force-cache",
    revalidate,
    headers = {},
    method = "GET",
    ...rest
  } = options

  const fetchOptions = {
    method,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    ...rest,
  }

  if (cache === "no-store") {
    fetchOptions.cache = "no-store"
  } else if (typeof revalidate === "number") {
    fetchOptions.next = {
      ...(fetchOptions.next || {}),
      revalidate,
    }
  }
  

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    signal: controller.signal,
  })

  clearTimeout(timeout)
  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(payload, `Request failed with status ${response.status}`)
    )
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
