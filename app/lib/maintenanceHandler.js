export function handleMaintenance(res, data, url = "") {

  const authEndpoints = [
    "/api/v1/auth/login",
    "/api/v1/auth/me/profile",
    "/api/v1/auth/google",
    "/api/v1/auth/discord",
    "/api/v1/auth/verify-otp"
  ]

  const isAuthEndpoint = authEndpoints.some(e => url.includes(e))

  if (res.status === 503 && data?.meta?.maintenance && !isAuthEndpoint) {

    const message = encodeURIComponent(
      data?.error?.message || "System Maintenance"
    )

    const scope = data?.meta?.scope || "system"

    window.location.replace(
      `/maintenance?scope=${scope}&message=${message}`
    )

    throw new Error("System Maintenance")
  }

}