const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (!API) {
    return normalizedPath
  }

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

export async function getPage(slug) {
  if (!API) {
    console.error("API URL tidak ditemukan")
    return null
  }

  try {
    const res = await fetch(
      // FIX: harus pakai template string, bukan regex
      buildApiUrl(`/api/v1/content/pages/${slug}`),
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      throw new Error("Gagal fetch halaman")
    }

    const json = await parseJsonSafe(res)

    // FIX: operator || 
    return json?.data || null
  } catch (err) {
    // FIX: console.error format
    console.error(`Error getPage (${slug}):`, err)
    return null
  }
}