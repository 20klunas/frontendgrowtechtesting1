import { DEFAULT_MAINTENANCE_STATE, normalizeFeatureAccess } from "./featureAccess"
import { serverFetchJson } from "./serverApi"

export async function getServerFeatureAccess(options = {}) {
  try {
    const payload = await serverFetchJson("/api/v1/content/feature-access", {
      cache: "no-store",
    })

    return normalizeFeatureAccess(payload?.data || {})
  } catch {
    return DEFAULT_MAINTENANCE_STATE
  }
}
