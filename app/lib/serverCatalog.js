import { serverFetch } from "./serverFetch"

const CATEGORY_REVALIDATE = 0
const PRODUCT_REVALIDATE = 0
const FEATURE_ACCESS_REVALIDATE = 300

function normalizeCollection(json) {
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.data?.data)) return json.data.data
  if (Array.isArray(json?.data?.categories)) return json.data.categories
  if (Array.isArray(json?.data?.subcategories)) return json.data.subcategories
  return []
}

function normalizePaginator(json, fallbackPerPage = 6) {
  const paginator = json?.data ?? {}

  return {
    items: Array.isArray(paginator?.data) ? paginator.data : [],
    pagination: {
      currentPage: Number(paginator?.current_page || 1),
      lastPage: Number(paginator?.last_page || 1),
      total: Number(paginator?.total || 0),
      perPage: Number(paginator?.per_page || fallbackPerPage),
    },
  }
}

function resolveCatalogMaintenance(payload) {
  const catalogAccess = payload?.data?.catalog_access

  if (catalogAccess?.enabled === false) {
    return catalogAccess.message || "Katalog sedang maintenance."
  }

  return ""
}

async function fetchFeatureAccessSnapshot() {
  try {
    return await serverFetch("/api/v1/content/feature-access", {
      next: { revalidate: FEATURE_ACCESS_REVALIDATE },
    })
  } catch {
    return null
  }
}

export async function getCategoryPageServerData() {
  const result = {
    categories: [],
    subcategories: [],
    maintenanceMessage: "",
  }

  const [access, categories, subcategories] = await Promise.allSettled([
    fetchFeatureAccessSnapshot(),
    serverFetch("/api/v1/catalog/categories", {
      next: { revalidate: CATEGORY_REVALIDATE },
    }),
    serverFetch("/api/v1/catalog/subcategories", {
      next: { revalidate: CATEGORY_REVALIDATE },
    }),
  ])

  if (access.status === "fulfilled") {
    result.maintenanceMessage = resolveCatalogMaintenance(access.value)

    if (result.maintenanceMessage) {
      console.warn(" catalog disabled:", result.maintenanceMessage)
      return result
    }
  } else {
    console.warn(" feature access failed:", access.reason)
  }

  if (categories.status === "fulfilled") {
    result.categories = normalizeCollection(categories.value)
  } else {
    console.error(" categories fetch failed:", categories.reason)
  }

  if (subcategories.status === "fulfilled") {
    result.subcategories = normalizeCollection(subcategories.value)
  } else {
    console.error(" subcategories fetch failed:", subcategories.reason)
  }

  return result
}

export async function getProductPageServerData({
  subcategoryId,
  sort = "latest",
  page = 1,
  perPage = 6,
}) {
  const result = {
    products: [],
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage,
    },
    subcategory: null,
    maintenanceMessage: "",
  }

  const params = new URLSearchParams()
  params.set("sort", String(sort))
  params.set("per_page", String(perPage))
  params.set("page", String(page))

  if (subcategoryId) {
    params.set("subcategory_id", String(subcategoryId))
  }

  const [access, products, subcategory] = await Promise.allSettled([
    fetchFeatureAccessSnapshot(),
    serverFetch(`/api/v1/products?${params.toString()}`, {
      next: { revalidate: 0 },
    }),
    subcategoryId
      ? serverFetch(`/api/v1/subcategories/${subcategoryId}`, {
          next: { revalidate: CATEGORY_REVALIDATE },
        })
      : Promise.resolve(null),
  ])

  if (access.status === "fulfilled") {
    result.maintenanceMessage = resolveCatalogMaintenance(access.value)

    if (result.maintenanceMessage) {
      console.warn(" catalog disabled:", result.maintenanceMessage)
      return result
    }
  } else {
    console.warn(" feature access failed:", access.reason)
  }

  if (products.status === "fulfilled") {
    const parsed = normalizePaginator(products.value, perPage)
    result.products = parsed.items
    result.pagination = parsed.pagination
  }

  if (subcategory.status === "fulfilled") {
    result.subcategory = subcategory.value?.data || null
  }

  return result
}

export async function getPublicCategoryBrowserServerData() {
  const [access, categories, subcategories] = await Promise.allSettled([
    fetchFeatureAccessSnapshot(),
    serverFetch("/api/v1/categories", {
      next: { revalidate: CATEGORY_REVALIDATE, tags: ["categories"] },
    }),
    serverFetch("/api/v1/subcategories", {
      next: { revalidate: CATEGORY_REVALIDATE, tags: ["subcategories"] },
    }),
  ])

  const maintenanceMessage =
    access.status === "fulfilled" ? resolveCatalogMaintenance(access.value) : ""

  if (maintenanceMessage) {
    return {
      categories: [],
      subcategories: [],
      maintenanceMessage,
    }
  }

  return {
    categories: categories.status === "fulfilled" ? normalizeCollection(categories.value) : [],
    subcategories:
      subcategories.status === "fulfilled" ? normalizeCollection(subcategories.value) : [],
    maintenanceMessage: "",
  }
}

export async function getPublicProductsServerData({
  subcategoryId = null,
  perPage = 100,
} = {}) {
  const params = new URLSearchParams()
  params.set("per_page", String(perPage))

  if (subcategoryId) {
    params.set("subcategory_id", String(subcategoryId))
  }

  try {
    const payload = await serverFetch(`/api/v1/products?${params.toString()}`, {
      next: { revalidate: 0 },
    })

    return normalizePaginator(payload, perPage).items
  } catch {
    return []
  }
}
