import Cookies from "js-cookie";
import { handleMaintenance } from "./maintenanceHandler";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function authFetch(url, options = {}) {
  const token = Cookies.get("token");

  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    cache: options.cache || "no-store",
  });

  if (res.status === 401) {
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("user_name");
    Cookies.remove("user_email");

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw new Error("Session expired");
  }

  const contentType = res.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    console.error("Non-JSON response:", text);
    throw new Error(`Server mengembalikan bukan JSON (HTTP ${res.status})`);
  }

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