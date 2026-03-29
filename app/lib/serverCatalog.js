import { serverFetchJson } from "./serverApi"
import { buildApiUrl } from "./apiUrl"
const CATEGORY_REVALIDATE = 300
const PRODUCT_REVALIDATE = 60
const FEATURE_ACCESS_REVALIDATE = 30
const PUBLIC_CATALOG_REVALIDATE = 300
const globalCache = new Map()
const pendingPromises = new Map()

function getCache(key) {
  const cached = globalCache.get(key)
  if (!cached) return null

  if (cached.expiry < Date.now()) {
    globalCache.delete(key)
    return null
  }

  return cached.data
}

function setCache(key, data, ttl = 300000) {
  globalCache.set(key, {
    data,
    expiry: Date.now() + ttl,
  })
}

function normalizeCollection(json) {
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.data?.data)) return json.data.data
  if (Array.isArray(json?.data?.categories)) return json.data.categories
  if (Array.isArray(json?.data?.subcategories)) return json.data.subcategories
  return null
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

async function fetchFeatureAccessSnapshot() {
  try {
    return await serverFetchJson("/api/v1/content/feature-access", {
      cache: "force-cache",
      revalidate: FEATURE_ACCESS_REVALIDATE,
    })
  } catch {
    return null
  }
}

export async function getCategoryPageServerData() {
  const result = {
    categories: null,
    subcategories: null,
    maintenanceMessage: "",
  }

  const [accessResult, categoriesResult, subcategoriesResult] =
    await Promise.allSettled([
      fetchFeatureAccessSnapshot(),
      serverFetchJson("/api/v1/catalog/categories", {
        cache: "force-cache",
        revalidate: CATEGORY_REVALIDATE,
      }),
      serverFetchJson("/api/v1/catalog/subcategories", {
        cache: "force-cache",
        revalidate: CATEGORY_REVALIDATE,
      }),
    ])

  if (accessResult.status === "fulfilled") {
    const catalogAccess = accessResult.value?.data?.catalog_access

    if (catalogAccess && catalogAccess.enabled === false) {
      result.maintenanceMessage =
        catalogAccess.message || "Katalog sedang maintenance."
      result.categories = []
      result.subcategories = []
      return result
    }
  }

  if (categoriesResult.status === "fulfilled") {
    result.categories = normalizeCollection(categoriesResult.value)
  }

  if (subcategoriesResult.status === "fulfilled") {
    result.subcategories = normalizeCollection(subcategoriesResult.value)
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
  params.set("sort", String(sort || "latest"))
  params.set("per_page", String(perPage || 6))
  params.set("page", String(page || 1))

  if (subcategoryId) {
    params.set("subcategory_id", String(subcategoryId))
  }

  const [accessResult, productsResult, subcategoryResult] =
    await Promise.allSettled([
      fetchFeatureAccessSnapshot(),
      serverFetchJson(`/api/v1/products?${params.toString()}`, {
        cache: "force-cache",
        revalidate: PRODUCT_REVALIDATE,
      }),
      subcategoryId
        ? serverFetchJson(`/api/v1/subcategories/${subcategoryId}`, {
            cache: "force-cache",
            revalidate: CATEGORY_REVALIDATE,
          })
        : Promise.resolve({ data: null }),
    ])

  if (accessResult.status === "fulfilled") {
    const catalogAccess = accessResult.value?.data?.catalog_access

    if (catalogAccess && catalogAccess.enabled === false) {
      result.maintenanceMessage =
        catalogAccess.message || "Katalog sedang maintenance."
      return result
    }
  }

  if (productsResult.status === "fulfilled") {
    const parsed = normalizePaginator(productsResult.value, perPage)
    result.products = parsed.items
    result.pagination = parsed.pagination
  }

  if (subcategoryResult.status === "fulfilled") {
    result.subcategory = subcategoryResult.value?.data || null
  }

  return result
}

export async function getPublicCategoryBrowserServerData() {
  const cacheKey = "public-catalog"

  const cached = getCache(cacheKey)
  if (cached) return cached

  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)
  }

  const promise = (async () => {
    try {
      const [categories, subcategories] = await Promise.allSettled([
        serverFetchJson("/api/v1/categories", {
          cache: "force-cache",
          revalidate: PUBLIC_CATALOG_REVALIDATE,
        }),
        serverFetchJson("/api/v1/subcategories", {
          cache: "force-cache",
          revalidate: PUBLIC_CATALOG_REVALIDATE,
        }),
      ])

      const result = {
        categories: normalizeCollection(categories) || [],
        subcategories: normalizeCollection(subcategories) || [],
      }

      setCache(cacheKey, result, 300000)
      return result
    } finally {
      pendingPromises.delete(cacheKey)
    }
  })()

  pendingPromises.set(cacheKey, promise)

  return promise
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
    const payload = await serverFetchJson(`/api/v1/products?${params.toString()}`, {
      cache: "force-cache",
      revalidate: PRODUCT_REVALIDATE,
    })

    return normalizePaginator(payload, perPage).items
  } catch {
    return []
  }
}
