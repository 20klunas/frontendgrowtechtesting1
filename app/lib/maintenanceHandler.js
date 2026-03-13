export function buildMaintenanceRedirectUrl(data) {
  const message = encodeURIComponent(
    data?.error?.message || "System Maintenance"
  );

  const scope = encodeURIComponent(
    data?.meta?.scope || "system"
  );

  const key = encodeURIComponent(
    data?.meta?.key || "maintenance"
  );

  return `/maintenance?scope=${scope}&key=${key}&message=${message}`;
}

export function handleMaintenance(res, data) {
  if (res.status === 503 && data?.meta?.maintenance) {
    const target = buildMaintenanceRedirectUrl(data);

    if (typeof window !== "undefined") {
      window.location.replace(target);
    }

    throw new Error("System Maintenance");
  }
}