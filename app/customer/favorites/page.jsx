import { cookies } from "next/headers"
import FavoritesClient from "./FavoritesClient"

export const dynamic = "force-dynamic"

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

async function getFavoritesServerData() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value || ""

    if (!token) {
      return {
        favorites: [],
        unauthorized: true,
      }
    }

    const response = await fetch(buildApiUrl("/api/v1/favorites?per_page=50"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const payload = await parseJsonSafe(response)

    if (response.status === 401 || response.status === 403) {
      return {
        favorites: [],
        unauthorized: true,
      }
    }

    if (!response.ok) {
      console.error("Failed fetch favorites on server:", payload)
      return {
        favorites: [],
        unauthorized: false,
      }
    }

    return {
      favorites: Array.isArray(payload?.data?.data) ? payload.data.data : [],
      unauthorized: false,
    }
  } catch (error) {
    console.error("Failed prepare favorites server data:", error)
    return {
      favorites: [],
      unauthorized: false,
    }
  }
}

export default async function Page() {
  const { favorites, unauthorized } = await getFavoritesServerData()

  return (
    <FavoritesClient
      initialFavorites={favorites}
      initialUnauthorized={unauthorized}
    />
  )
}
