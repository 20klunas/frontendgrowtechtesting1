const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

export const API_BASE_URL = API

export function buildApiUrl(path = "") {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path || "")
    : `/${String(path || "")}`

  if (!API) {
    return normalizedPath
  }

  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`
  }

  return `${API}${normalizedPath}`
}
