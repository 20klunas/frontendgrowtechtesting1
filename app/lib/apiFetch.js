import Cookies from "js-cookie";
import { handleMaintenance } from "./maintenanceHandler";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(url, options = {}) {
  const token = Cookies.get("token");

  const res = await fetch(`${API.replace(/\/$/, "")}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: options.cache || "no-store",
  });

  const json = await res.json().catch(() => null);

  if (json) {
    handleMaintenance(res, json);
  }

  if (!res.ok) {
    throw new Error(
      json?.error?.message ||
      json?.message ||
      `HTTP ${res.status}`
    );
  }

  return json;
}