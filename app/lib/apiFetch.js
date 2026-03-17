import Cookies from "js-cookie";
import { handleMaintenance } from "./maintenanceHandler";

const API = process.env.NEXT_PUBLIC_API_URL;

function resolveCacheMode(url, explicitCache) {
  if (explicitCache) return explicitCache;

  const path = String(url || "").toLowerCase();

  const noStorePatterns = [
    /\/api\/v1\/cart\b/,
    /\/api\/v1\/wallet\b/,
    /\/api\/v1\/orders?\b/,
    /\/api\/v1\/payments?\b/,
    /\/api\/v1\/topups?\b/,
    /\/api\/v1\/withdraws?\b/,
    /\/api\/v1\/auth\/me\b/,
    /\/api\/v1\/profile\b/,
    /\/api\/v1\/admin\/me\b/,
    /\/api\/v1\/admin\/orders?\b/,
    /\/api\/v1\/admin\/transactions?\b/,
    /\/api\/v1\/admin\/wallet\b/,
    /\/api\/v1\/admin\/withdraws?\b/,
    /\/api\/v1\/admin\/audit-logs?\b/,
    /\/api\/v1\/admin\/logs?\b/,
  ];

  const cacheablePatterns = [
    /\/api\/v1\/content\/settings\b/,
    /\/api\/v1\/content\/banners?\b/,
    /\/api\/v1\/content\/popups?\b/,
    /\/api\/v1\/content\/faqs?\b/,
    /\/api\/v1\/content\/terms\b/,
    /\/api\/v1\/content\/privacy\b/,
    /\/api\/v1\/catalog\/categories\b/,
    /\/api\/v1\/catalog\/subcategories\b/,
  ];

  if (noStorePatterns.some((pattern) => pattern.test(path))) {
    return "no-store";
  }

  if (cacheablePatterns.some((pattern) => pattern.test(path))) {
    return "force-cache";
  }

  return "default";
}

function buildHeaders(options = {}, token = null) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  return {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
}

export async function apiFetch(url, options = {}) {
  const token = Cookies.get("token");
  const cacheMode = resolveCacheMode(url, options.cache);

  const res = await fetch(`${API.replace(/\/$/, "")}${url}`, {
    ...options,
    headers: buildHeaders(options, token),
    cache: cacheMode,
  });

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