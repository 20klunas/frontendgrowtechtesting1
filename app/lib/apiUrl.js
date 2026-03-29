const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

export { API_BASE_URL }

export function buildApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (!API_BASE_URL) {
    console.warn("⚠️ API kosong, pakai relative path:", normalizedPath)
    return normalizedPath
  }

  return `${API_BASE_URL}${normalizedPath}`
}