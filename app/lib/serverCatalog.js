import { serverFetch } from "./serverFetch"
const CATEGORY_REVALIDATE = 300
const PRODUCT_REVALIDATE = 60
const FEATURE_ACCESS_REVALIDATE = 300
const PUBLIC_CATALOG_REVALIDATE = 300

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

  const accessPromise = fetchFeatureAccessSnapshot()

  const [categories, subcategories] = await Promise.all([
    serverFetch("/api/v1/catalog/categories", {
      next: { 
        revalidate: CATEGORY_REVALIDATE,
        tags: ["catalog-categories"]
      },
    }),
    serverFetch("/api/v1/catalog/subcategories", {
      next: { revalidate: CATEGORY_REVALIDATE },
    }),
  ])

  const access = await accessPromise

  const catalogAccess = access?.data?.catalog_access

  if (catalogAccess?.enabled === false) {
    result.maintenanceMessage =
      catalogAccess.message || "Katalog sedang maintenance."
    return result
  }

  result.categories = normalizeCollection(categories)
  result.subcategories = normalizeCollection(subcategories)

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

  const accessPromise = fetchFeatureAccessSnapshot()

  const [products, subcategory] = await Promise.all([
    serverFetch(`/api/v1/products?${params}`, {
      next: { revalidate: PRODUCT_REVALIDATE },
    }),
    subcategoryId
      ? serverFetch(`/api/v1/subcategories/${subcategoryId}`, {
          next: { revalidate: CATEGORY_REVALIDATE },
        })
      : Promise.resolve(null),
  ])

  const access = await accessPromise

  const catalogAccess = access?.data?.catalog_access

  if (catalogAccess?.enabled === false) {
    result.maintenanceMessage =
      catalogAccess.message || "Katalog sedang maintenance."
    return result
  }

  const parsed = normalizePaginator(products, perPage)
  result.products = parsed.items
  result.pagination = parsed.pagination

  result.subcategory = subcategory?.data || null

  return result
}


export async function getPublicCategoryBrowserServerData() {
  const accessPromise = fetchFeatureAccessSnapshot()
  const [categories, subcategories] = await Promise.all([
    serverFetch("/api/v1/categories", {
      next: { revalidate: CATEGORY_REVALIDATE, tags: ["categories"] },
    }),
    serverFetch("/api/v1/subcategories", {
      next: { revalidate: CATEGORY_REVALIDATE, tags: ["subcategories"] },
    }),
  ])
  const access = await accessPromise
  return {
    categories: normalizeCollection(categories),
    subcategories: normalizeCollection(subcategories),
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
    const payload = await serverFetch(`/api/v1/products?${params}`, {
      next: { revalidate: PRODUCT_REVALIDATE },
    })

    return normalizePaginator(payload, perPage).items
  } catch {
    return []
  }
}
