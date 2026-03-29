import { cookies } from "next/headers"
import { buildApiUrl } from "./apiUrl"
import { parseJsonSafe } from "./serverApi"

async function getServerToken() {
  try {
    const cookieStore = await cookies()
    return cookieStore.get("token")?.value || ""
  } catch {
    return ""
  }
}

export async function getServerShellBootstrap() {
  const token = await getServerToken()

  if (!token) {
    return null
  }

  try {
    const response = await fetch(buildApiUrl("/api/v1/bootstrap/shell"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const payload = await parseJsonSafe(response)

    if (!response.ok) {
      return null
    }

    return payload?.data || null
  } catch (err) {
    console.error("Bootstrap fetch error:", err)
    return null
  }
}
