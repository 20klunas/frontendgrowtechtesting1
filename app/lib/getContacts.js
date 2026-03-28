const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

function buildApiUrl(path) {
  // FIX: template string
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (!API) {
    return normalizedPath
  }

  // FIX: template string + regex benar
  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`
  }

  return `${API}${normalizedPath}`
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function getContacts() {
  if (!API) {
    console.error("API URL tidak ditemukan")
    return []
  }

  try {
    const res = await fetch(
      buildApiUrl("/api/v1/content/settings?group=contact"),
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // ISR cache 5 menit
      }
    )

    if (!res.ok) {
      throw new Error("Gagal fetch kontak")
    }

    const json = await parseJsonSafe(res)

    return Array.isArray(json?.data) ? json.data : []
  } catch (err) {
    console.error("Error getContacts:", err)
    return []
  }
}