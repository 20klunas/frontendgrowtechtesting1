import { cookies } from "next/headers";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API) {
    return normalizedPath;
  }

  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`;
  }

  return `${API}${normalizedPath}`;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload, fallback) {
  return (
    payload?.message ||
    payload?.error?.message ||
    payload?.meta?.message ||
    payload?.data?.message ||
    fallback
  );
}

function isFeatureMaintenancePayload(payload, featureKey) {
  const text = JSON.stringify(payload || {}).toLowerCase();
  const feature = String(featureKey || "").toLowerCase();

  const hasMaintenanceKeyword =
    text.includes("maintenance") ||
    text.includes("feature_maintenance") ||
    text.includes("feature maintenance");

  if (!hasMaintenanceKeyword) {
    return false;
  }

  if (!feature) {
    return true;
  }

  return text.includes(feature);
}

async function fetchJson(path, options = {}) {
  const { auth = false, revalidate = 60 } = options;

  const headers = {
    Accept: "application/json",
  };

  if (auth) {
    const token = cookies().get("token")?.value;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildApiUrl(path), {
    headers,
    ...(auth ? { cache: "no-store" } : { next: { revalidate } }),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(payload, `Request failed with status ${response.status}`)
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function getCustomerHomeServerData() {
  const result = {
    popup: null,
    banners: [],
    products: [],
    catalogMaintenance: "",
  };

  const [bannersResult, popupResult, productsResult] = await Promise.allSettled([
    fetchJson("/api/v1/content/banners", { revalidate: 120 }),
    fetchJson("/api/v1/content/popup", { revalidate: 60 }),
    fetchJson("/api/v1/catalog/products?sort=popular&per_page=4"), 
  ]);

  if (bannersResult.status === "fulfilled") {
    result.banners = bannersResult.value?.data || [];
  } else {
    console.error("Failed to fetch banners:", bannersResult.reason);
  }

  if (popupResult.status === "fulfilled") {
    const popupData = popupResult.value?.data;
    if (popupData?.is_active) {
      result.popup = popupData;
    }
  } else {
    console.error("Failed to fetch popup:", popupResult.reason);
  }

  if (productsResult.status === "fulfilled") {
    result.products = productsResult.value?.data?.data || [];
  } else {
    const payload = productsResult.reason?.payload;

    if (isFeatureMaintenancePayload(payload, "catalog_access")) {
      result.catalogMaintenance = getErrorMessage(
        payload,
        "Katalog sedang maintenance."
      );
    } else {
      console.error("Failed to fetch popular products:", productsResult.reason);
    }
  }

  return result;
}