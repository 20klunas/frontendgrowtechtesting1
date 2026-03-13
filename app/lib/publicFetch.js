import { handleMaintenance } from "./maintenanceHandler";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function publicFetch(url, options = {}) {

  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const contentType = res.headers.get("content-type");

  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  }

  /*
  =========================
  HANDLE MAINTENANCE
  =========================
  */

  handleMaintenance(res, data);

  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
      data?.message ||
      `HTTP ${res.status}`
    );
  }

  return data;
}