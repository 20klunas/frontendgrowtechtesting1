import { normalizeSettings } from "../../utils/normalizeSettings"

const API = process.env.NEXT_PUBLIC_API_URL

/* ===============================
   WEBSITE SETTINGS
================================ */

export async function getWebsiteSettings() {

  try {

    const res = await fetch(
      `${API}/api/v1/content/settings?group=website`,
      {
        cache: "force-cache",
        next: { revalidate: 300 }
      }
    )

    if (!res.ok) {
      throw new Error("Failed fetch settings")
    }

    const json = await res.json()

    const data = normalizeSettings(json?.data || [])

    return {
      brand: data.brand || {},
      footer: data.footer || {},
      raw: data
    }

  } catch (err) {

    console.error("Failed fetch settings:", err)

    return {
      brand: {},
      footer: {},
      raw: {}
    }

  }

}


/* ===============================
   WEBSITE BANNERS
================================ */

export async function getBanners() {

  try {

    const res = await fetch(
      `${API}/api/v1/content/banners`,
      {
        cache: "force-cache",
        next: { revalidate: 120 }
      }
    )

    if (!res.ok) {
      throw new Error("Failed fetch banners")
    }

    const json = await res.json()

    return json?.data || []

  } catch (err) {

    console.error("Failed fetch banners:", err)

    return []

  }

}