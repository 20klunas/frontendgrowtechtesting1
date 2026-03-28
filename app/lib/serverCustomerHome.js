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

async function getServerToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value || "";
  } catch {
    return "";
  }
}

async function fetchJson(path, options = {}) {
  const { revalidate = 60, cacheMode, extraHeaders = {} } = options;

  const headers = {
    Accept: "application/json",
    ...extraHeaders,
  };

  const fetchOptions = {
    headers,
  };

  if (cacheMode) {
    fetchOptions.cache = cacheMode;
  } else {
    fetchOptions.next = { revalidate };
  }

  const response = await fetch(buildApiUrl(path), fetchOptions);
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

async function fetchCustomerHomeBootstrap() {
  const token = await getServerToken();

  if (!API || !token) {
    return null;
  }

  try {
    const response = await fetch(buildApiUrl("/api/v1/bootstrap/customer-home"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      return null;
    }

    return {
      popup: payload?.data?.popup || null,
      banners: payload?.data?.banners || [],
      products: payload?.data?.products || [],
      catalogMaintenance: payload?.data?.catalog_maintenance || "",
    };
  } catch {
    return null;
  }
}

/**
 * fallback legacy
 */
async function getPopularProductsServerSafe() {
  const result = {
    products: [],
    catalogMaintenance: "",
  };

  const token = await getServerToken();

  try {
    const extraHeaders = {};
    if (token) {
      extraHeaders.Authorization = `Bearer ${token}`;
    }

    const payload = await fetchJson(
      "/api/v1/catalog/products?sort=popular&per_page=4",
      token
        ? {
            cacheMode: "no-store",
            extraHeaders,
          }
        : {
            revalidate: 60,
          }
    );

    result.products = payload?.data?.data || [];
    return result;
  } catch (error) {
    const payload = error?.payload;
    const status = error?.status;

    if (isFeatureMaintenancePayload(payload, "catalog_access")) {
      result.catalogMaintenance = getErrorMessage(
        payload,
        "Katalog sedang maintenance."
      );
      return result;
    }

    if (status === 401 || status === 403) {
      return result;
    }

    console.error("Failed to fetch popular products on server:", error);
    return result;
  }
}

async function getCustomerHomeLegacyData() {
  const result = {
    popup: null,
    banners: [],
    products: [],
    catalogMaintenance: "",
  };

  const [bannersResult, popupResult, productsResult] = await Promise.allSettled([
    fetchJson("/api/v1/content/banners", { revalidate: 120 }),
    fetchJson("/api/v1/content/popup", { revalidate: 60 }),
    getPopularProductsServerSafe(),
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
    result.products = productsResult.value?.products || [];
    result.catalogMaintenance =
      productsResult.value?.catalogMaintenance || "";
  } else {
    console.error(
      "Failed to prepare popular products result:",
      productsResult.reason
    );
  }

  return result;
}

export async function getCustomerHomeServerData() {
  const bootstrapData = await fetchCustomerHomeBootstrap();

  if (bootstrapData) {
    return bootstrapData;
  }

  return getCustomerHomeLegacyData();
}