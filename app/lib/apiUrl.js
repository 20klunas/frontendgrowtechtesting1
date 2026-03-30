const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

export { API_BASE_URL }

export function buildApiUrl(path = "") {

  // kalau sudah full URL → return langsung
  if (path.startsWith("http")) {
    return path;
  }

  const normalizedPath = String(path || "").startsWith("/")
    ? String(path || "")
    : `/${String(path || "")}`

  if (!API_BASE_URL) {
    return normalizedPath
  }
  

  if (API_BASE_URL.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API_BASE_URL}${normalizedPath.replace(/^\/api\/v1/, "")}`
  }

  return `${API_BASE_URL}${normalizedPath}`
}
