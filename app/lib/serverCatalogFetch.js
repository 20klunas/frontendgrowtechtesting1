const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function buildApiUrl(path) {
  if (!API) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractListData(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function readMaintenanceMessage(payload, fallback = "Katalog sedang maintenance.") {
  if (!payload) return "";

  const message =
    payload?.error?.message ||
    payload?.message ||
    payload?.meta?.message ||
    payload?.data?.message ||
    "";

  const code =
    payload?.error?.code ||
    payload?.code ||
    payload?.error?.type ||
    "";

  const feature =
    payload?.error?.feature ||
    payload?.feature ||
    "";

  const normalized = `${message} ${code} ${feature}`.toLowerCase();

  const isMaintenance =
    payload?.maintenance === true ||
    normalized.includes("maintenance") ||
    normalized.includes("feature_maintenance") ||
    normalized.includes("system_maintenance");

  return isMaintenance ? message || fallback : "";
}

async function fetchApiJson(path, options = {}) {
  const {
    cache = "force-cache",
    revalidate = 60,
    headers = {},
  } = options;

  try {
    const res = await fetch(buildApiUrl(path), {
      headers: {
        Accept: "application/json",
        ...headers,
      },
      ...(cache === "no-store"
        ? { cache: "no-store" }
        : { next: { revalidate } }),
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const payload = isJson ? await res.json().catch(() => null) : null;

    return {
      ok: res.ok,
      status: res.status,
      payload,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      payload: null,
    };
  }
}

export async function getCategoryPageData() {
  const [categoriesRes, subcategoriesRes] = await Promise.all([
    fetchApiJson("/api/v1/catalog/categories", {
      revalidate: 300,
    }),
    fetchApiJson("/api/v1/catalog/subcategories", {
      revalidate: 300,
    }),
  ]);

  const maintenanceMessage =
    readMaintenanceMessage(categoriesRes.payload) ||
    readMaintenanceMessage(subcategoriesRes.payload);

  return {
    categories: maintenanceMessage ? [] : extractListData(categoriesRes.payload),
    subcategories: maintenanceMessage ? [] : extractListData(subcategoriesRes.payload),
    maintenanceMessage,
  };
}

function sanitizeSort(sort) {
  const allowed = ["latest", "bestseller", "favorite", "popular", "rating"];
  return allowed.includes(sort) ? sort : "latest";
}

function buildProductHeader({ products, subcategories, categories, subcategoryId }) {
  const firstProduct = Array.isArray(products) ? products[0] : null;

  let subcategory = firstProduct?.subcategory || null;
  let category = firstProduct?.category || null;

  if ((!subcategory || !category) && subcategoryId) {
    const foundSubcategory = subcategories.find(
      (item) => String(item?.id) === String(subcategoryId)
    );

    if (foundSubcategory) {
      subcategory = subcategory || foundSubcategory;
      category =
        category ||
        categories.find(
          (item) => String(item?.id) === String(foundSubcategory?.category_id)
        ) ||
        null;
    }
  }

  return {
    subcategory,
    category,
  };
}

export async function getProductPageData({ subcategoryId = null, sort = "latest" } = {}) {
  const safeSort = sanitizeSort(sort);

  let productPath = `/api/v1/products?sort=${encodeURIComponent(safeSort)}&per_page=60`;

  if (subcategoryId) {
    productPath += `&subcategory_id=${encodeURIComponent(subcategoryId)}`;
  }

  const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
    fetchApiJson(productPath, {
      cache: "no-store",
    }),
    fetchApiJson("/api/v1/catalog/categories", {
      revalidate: 300,
    }),
    fetchApiJson("/api/v1/catalog/subcategories", {
      revalidate: 300,
    }),
  ]);

  const maintenanceMessage =
    readMaintenanceMessage(productsRes.payload) ||
    readMaintenanceMessage(categoriesRes.payload) ||
    readMaintenanceMessage(subcategoriesRes.payload);

  const products = maintenanceMessage ? [] : extractListData(productsRes.payload);
  const categories = extractListData(categoriesRes.payload);
  const subcategories = extractListData(subcategoriesRes.payload);

  const header = buildProductHeader({
    products,
    categories,
    subcategories,
    subcategoryId,
  });

  return {
    sort: safeSort,
    products,
    header,
    maintenanceMessage,
  };
}