export function handleMaintenance(res, data) {

  if (res.status === 503 && data?.meta?.maintenance) {

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