const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

export function buildApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (!API) {
    console.warn("⚠️ API kosong, pakai relative path:", normalizedPath)
    return normalizedPath
  }

  return `${API}${normalizedPath}`
}