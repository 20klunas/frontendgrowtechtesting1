const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (!API) {
    return normalizedPath
  }

  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`
  }

  return `${API}${normalizedPath}`
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function fetchJson(path, options = {}) {
  const { cache = "force-cache", revalidate = 10 } = options

  const requestOptions = {
    headers: {
      Accept: "application/json",
    },
    cache,
  }

  if (typeof revalidate === "number") {
    requestOptions.next = { revalidate }
  }

  const response = await fetch(buildApiUrl(path), requestOptions)
  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
        payload?.message ||
        `Request failed with status ${response.status}`
    )
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

function normalizeCollection(json) {
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.data?.data)) return json.data.data
  if (Array.isArray(json?.data?.categories)) return json.data.categories
  if (Array.isArray(json?.data?.subcategories)) return json.data.subcategories
  return null
}

function normalizePaginator(json) {
  const paginator = json?.data ?? {}

  return {
    items: Array.isArray(paginator?.data) ? paginator.data : [],
    pagination: {
      currentPage: Number(paginator?.current_page || 1),
      lastPage: Number(paginator?.last_page || 1),
      total: Number(paginator?.total || 0),
      perPage: Number(paginator?.per_page || 6),
    },
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
      fetchJson("/api/v1/content/feature-access", { revalidate: 10 }),
      fetchJson("/api/v1/catalog/categories", { revalidate: 10 }),
      fetchJson("/api/v1/catalog/subcategories", { revalidate: 10 }),
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
      fetchJson("/api/v1/content/feature-access", { revalidate: 10 }),
      fetchJson(`/api/v1/products?${params.toString()}`, { revalidate: 10 }),
      subcategoryId
        ? fetchJson(`/api/v1/subcategories/${subcategoryId}`, {
            revalidate: 10,
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
    const parsed = normalizePaginator(productsResult.value)
    result.products = parsed.items
    result.pagination = parsed.pagination
  }

  if (subcategoryResult.status === "fulfilled") {
    result.subcategory = subcategoryResult.value?.data || null
  }

  return result
}