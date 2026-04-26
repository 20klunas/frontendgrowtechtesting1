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

export async function getFaqs() {
  if (!API) {
    console.error("API URL tidak ditemukan")
    return []
  }

  try {
    const res = await fetch(buildApiUrl("/api/v1/content/faqs"), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error("Gagal fetch FAQ")
    }

    const json = await parseJsonSafe(res)
    const list = Array.isArray(json?.data) ? json.data : []

    return list
      .filter((faq) => faq?.is_active)
      .sort(
        (a, b) =>
          Number(a?.sort_order || 0) - Number(b?.sort_order || 0)
      )
  } catch (err) {
    console.error("Error getFaqs:", err)
    return []
  }
}