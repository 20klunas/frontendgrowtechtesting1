import { DEFAULT_MAINTENANCE_STATE, normalizeFeatureAccess } from "./featureAccess"
import { serverFetchJson } from "./serverApi"

export async function getServerFeatureAccess(options = {}) {
  const { revalidate = 30 } = options

  try {
    const payload = await serverFetchJson("/api/v1/content/feature-access", {
      cache: "force-cache",
      revalidate,
    })

    return normalizeFeatureAccess(payload?.data || {})
  } catch {
    return DEFAULT_MAINTENANCE_STATE
  }
}
