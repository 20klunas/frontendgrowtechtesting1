export function handleMaintenance(res, data) {

  if (res.status === 503 && data?.meta?.maintenance) {

    const pathname = window.location.pathname;

    // Jangan redirect jika sedang di halaman OTP
    if (pathname.startsWith("/verify-otp")) {
      return;
    }

    const message = encodeURIComponent(
      data?.error?.message || "System Maintenance"
    );

    const scope = data?.meta?.scope || "system";

    window.location.href = `/maintenance?scope=${scope}&message=${message}`;

    throw new Error("System Maintenance");
  }
}