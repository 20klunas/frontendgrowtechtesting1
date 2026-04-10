"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Star,
} from "lucide-react"
import { cn } from "../../../lib/utils"
import { fetcher } from "../../../lib/fetcher"
import { notifyCustomerCartChanged } from "../../../lib/customerCartEvents"
import { useAuth } from "../../../hooks/useAuth"
import useCatalogAccess from "../../../hooks/useCatalogAccess"
import { notifyFavoriteChanged } from "../../../lib/favoriteEvents"
import { clearCheckoutBootstrapCache, writeCheckoutBootstrapCache } from "../../../lib/clientBootstrap"

const ITEMS_PER_PAGE = 6
const FAVORITE_IDS_TTL = 2 * 60 * 1000
const CHECKOUT_PAGE_PATH = "/customer/category/product/detail/lengkapipembelian"

const favoriteMemoryCache = new Map()

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

function favoriteStorageKey(userId) {
  return `favorite-product-ids-v1:${userId}`
}

function getDefaultPagination() {
  return {
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: ITEMS_PER_PAGE,
  }
}

function getCachedFavoriteIds(userId) {
  if (!userId) return null

  const memoryEntry = favoriteMemoryCache.get(userId)
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return new Set(memoryEntry.ids)
  }

  if (!canUseSessionStorage()) {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(favoriteStorageKey(userId))
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(favoriteStorageKey(userId))
      return null
    }

    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.map((id) => Number(id)).filter(Boolean)
      : []

    favoriteMemoryCache.set(userId, {
      ids,
      expiresAt: parsed.expiresAt,
    })

    return new Set(ids)
  } catch {
    return null
  }
}

function persistFavoriteIds(userId, ids) {
  if (!userId) return

  const safeIds = Array.from(
    new Set(Array.from(ids || []).map((id) => Number(id)).filter(Boolean))
  )

  const entry = {
    ids: safeIds,
    expiresAt: Date.now() + FAVORITE_IDS_TTL,
  }

  favoriteMemoryCache.set(userId, entry)

  if (!canUseSessionStorage()) {
    return
  }

  try {
    window.sessionStorage.setItem(
      favoriteStorageKey(userId),
      JSON.stringify(entry)
    )
  } catch {}
}

function normalizeProductsResponse(json) {
  const paginator = json?.data ?? {}
  return {
    items: Array.isArray(paginator?.data) ? paginator.data : [],
    currentPage: Number(paginator?.current_page || 1),
    lastPage: Number(paginator?.last_page || 1),
    total: Number(paginator?.total || 0),
    perPage: Number(paginator?.per_page || ITEMS_PER_PAGE),
  }
}

function formatPrice(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`
}

function getProductImage(product, fallback) {
  return (
    product?.image_url ||
    product?.image ||
    product?.thumbnail_url ||
    product?.thumbnail ||
    product?.subcategory?.image_url ||
    product?.subcategory?.image ||
    fallback ||
    "/placeholder.png"
  )
}

function getBadgeLabel(product) {
  if (product?.delivery_type) return product.delivery_type
  if (product?.delivery_mode) return product.delivery_mode
  if (product?.type === "ACCOUNT_CREDENTIAL") return "Otomatis"
  return "Otomatis"
}

export default function CustomerProductContent({
  initialSubcategoryId = null,
  initialProducts = null,
  initialPagination = null,
  initialSubcategory = null,
  initialMaintenanceMessage = "",
  initialSort = "latest",
  initialPage = 1,
}) {
  const router = useRouter()
  const subcategoryId = initialSubcategoryId

  const [products, setProducts] = useState(
    Array.isArray(initialProducts) ? initialProducts : []
  )
  const [loading, setLoading] = useState(!Array.isArray(initialProducts))

  const [subcategoryInfo, setSubcategoryInfo] = useState(initialSubcategory || null)
  const [subcategoryLoading, setSubcategoryLoading] = useState(false)

  const [addingId, setAddingId] = useState(null)
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null)
  const [sort, setSort] = useState(initialSort || "latest")

  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null)

  const [currentPage, setCurrentPage] = useState(Math.max(1, Number(initialPage || 1)))
  const [pagination, setPagination] = useState(
    initialPagination || getDefaultPagination()
  )

  const [catalogMaintenance, setCatalogMaintenance] = useState(
    initialMaintenanceMessage || ""
  )

  const { catalogDisabled, catalogMessage } = useCatalogAccess()
  const { user } = useAuth()

  const userId = user?.id || null
  const userTier = user?.tier?.toLowerCase() || "guest"

  const visibleProducts = products
  const requestIdRef = useRef(0)
  const skipFirstClientFetchRef = useRef(Array.isArray(initialProducts))
  const detailPrefetchedIdsRef = useRef(new Set())
  const actionLockRef = useRef(false)

  const resolvedSubcategory =
    subcategoryInfo || visibleProducts?.[0]?.subcategory || null

  const resolvedCategory =
    resolvedSubcategory?.category || visibleProducts?.[0]?.category || null

  const headerImage =
    resolvedSubcategory?.image_url ||
    resolvedSubcategory?.image ||
    visibleProducts?.[0]?.subcategory?.image_url ||
    visibleProducts?.[0]?.subcategory?.image ||
    "/placeholder.png"

  const headerCategoryName = resolvedCategory?.name || "Kategori"
  const headerSubcategoryName = resolvedSubcategory?.name || "Produk"
  const headerDescription =
    resolvedSubcategory?.description || "Deskripsi subkategori akan tampil di sini"

  const totalPages = Math.max(1, Number(pagination?.lastPage || 1))

  useEffect(() => {
    setProducts(Array.isArray(initialProducts) ? initialProducts : [])
    setPagination(initialPagination || getDefaultPagination())
    setSubcategoryInfo(initialSubcategory || null)
    setCatalogMaintenance(initialMaintenanceMessage || "")
    setSort(initialSort || "latest")
    setCurrentPage(Math.max(1, Number(initialPage || 1)))
    setLoading(!Array.isArray(initialProducts))
    skipFirstClientFetchRef.current = Array.isArray(initialProducts)
  }, [
    initialSubcategoryId,
    initialProducts,
    initialPagination,
    initialSubcategory,
    initialMaintenanceMessage,
    initialSort,
    initialPage,
  ])

  const loadProducts = useCallback(
    async ({ silent = false, force = false } = {}) => {
      const requestId = ++requestIdRef.current

      if (!silent) {
        setLoading(true)
      }

      try {
        setCatalogMaintenance("")

        const params = new URLSearchParams()
        params.set("sort", sort)
        params.set("per_page", String(ITEMS_PER_PAGE))
        params.set("page", String(currentPage))

        if (subcategoryId) {
          params.set("subcategory_id", String(subcategoryId))
        }

        const json = await fetcher(`/api/v1/products?${params.toString()}`, {}, { force: true })

        if (requestId !== requestIdRef.current) return

        const parsed = normalizeProductsResponse(json)

        setProducts(parsed.items)
        setPagination({
          currentPage: parsed.currentPage,
          lastPage: parsed.lastPage,
          total: parsed.total,
          perPage: parsed.perPage,
        })
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        console.error("Failed fetch products:", err)
        setProducts([])
        setPagination(getDefaultPagination())
      } finally {
        if (requestId === requestIdRef.current && !silent) {
          setLoading(false)
        }
      }
    },
    [subcategoryId, sort, currentPage]
  )

  useEffect(() => {
    const canReuseInitialSnapshot =
      skipFirstClientFetchRef.current && currentPage === 1 && sort === "latest"

    if (canReuseInitialSnapshot) {
      skipFirstClientFetchRef.current = false
      return
    }

    loadProducts()
  }, [loadProducts, currentPage, sort, subcategoryId])


  useEffect(() => {
    const params = new URLSearchParams()
    if (subcategoryId) params.set("subcategory_id", String(subcategoryId))
    if (sort && sort !== "latest") params.set("sort", sort)
    if (currentPage > 1) params.set("page", String(currentPage))
    const next = `/customer/category/product${params.toString() ? `?${params.toString()}` : ""}`
    router.replace(next, { scroll: false })
  }, [router, subcategoryId, sort, currentPage])

  useEffect(() => {
    if (!subcategoryId) {
      setSubcategoryInfo(null)
      return
    }

    const initialMatchesCurrent =
      initialSubcategory &&
      String(initialSubcategory?.id ?? "") === String(subcategoryId)

    if (initialMatchesCurrent) {
      setSubcategoryInfo(initialSubcategory || null)
      return
    }

    let active = true

    const fetchSubcategoryInfo = async () => {
      try {
        setSubcategoryLoading(true)
        const json = await fetcher(`/api/v1/subcategories/${subcategoryId}`, {}, { force: true })
        if (!active) return
        setSubcategoryInfo(json?.data || null)
      } catch (err) {
        if (!active) return
        console.error("Failed fetch subcategory info:", err)
        setSubcategoryInfo(null)
      } finally {
        if (active) setSubcategoryLoading(false)
      }
    }

    fetchSubcategoryInfo()

    return () => {
      active = false
    }
  }, [subcategoryId, initialSubcategory])

  useEffect(() => {
    const handleFavoriteChanged = () => {
      if (!userId) return
      const cached = getCachedFavoriteIds(userId)
      if (cached) {
        setFavoriteIds(cached)
      }
    }

    window.addEventListener("favorite:changed", handleFavoriteChanged)
    return () => window.removeEventListener("favorite:changed", handleFavoriteChanged)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set())
      return
    }

    const cached = getCachedFavoriteIds(userId)
    if (cached) {
      setFavoriteIds(cached)
      return
    }

    let active = true
    let timeoutId = null
    let idleId = null

    const loadFavorites = async () => {
      try {
        const json = await fetcher("/api/v1/favorites?per_page=50", {}, { auth: true })

        if (!active) return

        const favoritesArray = Array.isArray(json?.data?.data) ? json.data.data : []
        const ids = new Set(
          favoritesArray.map((fav) => Number(fav.product_id)).filter(Boolean)
        )

        setFavoriteIds(ids)
        persistFavoriteIds(userId, ids)
      } catch (err) {
        if (!active) return
        console.error("fetchFavorites error:", err)
        setFavoriteIds(new Set())
      }
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(loadFavorites, { timeout: 1000 })
    } else {
      timeoutId = window.setTimeout(loadFavorites, 150)
    }

    return () => {
      active = false
      if (timeoutId) window.clearTimeout(timeoutId)
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId)
      }
    }
  }, [userId])

  const showMaintenance =
    catalogDisabled || Boolean(catalogMaintenance || catalogMessage)

  const tieredPriceLabel = useMemo(() => {
    switch (userTier) {
      case "vip":
        return "Harga VIP"
      case "reseller":
        return "Harga Reseller"
      case "member":
        return "Harga Member"
      default:
        return "Harga"
    }
  }, [userTier])

  const updateFavoriteState = (updater) => {
    setFavoriteIds((prev) => {
      const next = updater(new Set(prev))
      if (userId) {
        persistFavoriteIds(userId, next)
      }
      return next
    })
  }

  const toggleFavorite = async (productId) => {
    if (!user) {
      router.push("/login")
      return
    }

    const isFav = favoriteIds.has(productId)

    updateFavoriteState((next) => {
      if (isFav) next.delete(productId)
      else next.add(productId)
      return next
    })

    try {
      setFavoriteLoadingId(productId)

      if (isFav) {
        await fetcher(
          `/api/v1/favorites/${productId}`,
          {
            method: "DELETE",
          },
          { auth: true }
        )
      } else {
        await fetcher(
          "/api/v1/favorites",
          {
            method: "POST",
            body: JSON.stringify({ product_id: productId }),
          },
          { auth: true }
        )
      }

      notifyFavoriteChanged()
    } catch (err) {
      console.error("toggleFavorite error:", err)

      updateFavoriteState((next) => {
        if (isFav) next.add(productId)
        else next.delete(productId)
        return next
      })

      alert(err.message || "Gagal memperbarui favorite")
    } finally {
      setFavoriteLoadingId(null)
    }
  }

  const ensureAuthenticated = () => {
    if (user) return true
    router.push("/login")
    return false
  }

  const buyNow = async (productId) => {
    if (actionLockRef.current) return

    const product = products.find((item) => item.id === productId)
    if (!product || Number(product.available_stock) <= 0) {
      alert("Stok habis")
      return
    }

    if (!ensureAuthenticated()) return

    actionLockRef.current = true
    setCheckoutLoadingId(productId)

    try {
      clearCheckoutBootstrapCache()

      const checkout = await fetcher(
        "/api/v1/orders",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: productId,
            qty: 1,
            voucher_code: null,
          }),
        },
        { auth: true }
      )

      if (!checkout?.success) {
        throw new Error("Checkout gagal")
      }

      writeCheckoutBootstrapCache({ checkout: checkout?.data || null })
      router.push(CHECKOUT_PAGE_PATH)
    } catch (err) {
      console.error("buyNow:", err)
      alert(err.message || "Gagal checkout")
    } finally {
      actionLockRef.current = false
      setCheckoutLoadingId(null)
    }
  }

  const addToCart = async (productId) => {
    if (actionLockRef.current) return

    const product = products.find((item) => item.id === productId)
    if (!product || Number(product.available_stock) <= 0) {
      alert("Stok habis")
      return
    }

    if (!ensureAuthenticated()) return

    actionLockRef.current = true
    setAddingId(productId)

    try {
      notifyCustomerCartChanged({
        type: "add",
        item: {
          id: productId,
          product_id: productId,
          qty: 1,
          product: {
            id: productId,
            name: product?.name || "Produk",
            image_url: getProductImage(product, headerImage),
          },
          unit_price:
            product?.tier_pricing?.[userTier] ||
            product?.tier_pricing?.member ||
            product?.price ||
            0,
        },
        skipServerSync: true,
      })

      const response = await fetcher(
        "/api/v1/cart/items",
        {
          method: "POST",
          body: JSON.stringify({ product_id: productId, qty: 1 }),
        },
        { auth: true }
      )

      clearCheckoutBootstrapCache()

      if (Array.isArray(response?.data?.items)) {
        notifyCustomerCartChanged({
          type: "server-snapshot",
          items: response.data.items,
          skipServerSync: true,
        })
      } else {
        notifyCustomerCartChanged({ type: "refresh" })
      }
    } catch (err) {
      console.error("addToCart:", err)

      const serverItems = err?.data?.data?.items

      if (Array.isArray(serverItems)) {
        notifyCustomerCartChanged({
          type: "server-snapshot",
          items: serverItems,
          skipServerSync: true,
        })
      } else {
        notifyCustomerCartChanged({ type: "refresh" })
      }

      alert(err.message || "Gagal menambahkan ke keranjang")
    } finally {
      actionLockRef.current = false
      setAddingId(null)
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mb-8 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[22px] border border-fuchsia-600/60 bg-[#111827]"
        >
          <div className="relative aspect-[16/8.2] w-full">
            <Image
              src={headerImage}
              alt={headerSubcategoryName}
              fill
              priority
              className="object-cover"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-full flex-col justify-center"
        >
          <div className="mb-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-400">
              {headerCategoryName}
            </p>
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-fuchsia-200 sm:text-4xl">
            {headerSubcategoryName}
          </h1>

          <p className="max-w-2xl text-sm leading-8 text-white/85 sm:text-base">
            {headerDescription}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-semibold text-fuchsia-200">
              {tieredPriceLabel}
            </span>
            {subcategoryLoading ? (
              <span className="text-xs text-white/60">Memuat informasi...</span>
            ) : (
              <span className="text-xs text-white/60">
                {pagination?.total || visibleProducts.length} produk tersedia
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/70">
          Menampilkan <span className="font-semibold text-white">{visibleProducts.length}</span>{" "}
          produk
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-white/70">Urutkan</label>
          <select
            value={sort}
            onChange={(e) => {
              const nextSort = e.target.value
              setSort(nextSort)
              setCurrentPage(1)
            }}
            className="min-w-[180px] rounded-xl border border-fuchsia-700/50 bg-[#12031f] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-500"
          >
            <option value="latest">Terbaru</option>
            <option value="bestseller">Terlaris</option>
            <option value="popular">Popular</option>
            <option value="rating">Rating</option>
            <option value="favorite">Favorit</option>
          </select>
        </div>
      </div>

      {showMaintenance ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center text-amber-100">
          {catalogMaintenance || catalogMessage || "Katalog sedang maintenance."}
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-fuchsia-700/20 bg-[#090909] p-8 text-center text-white/70">
          Memuat produk...
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-fuchsia-700/20 bg-[#090909] p-8 text-center text-white/70">
          Belum ada produk pada subkategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product, index) => {
            const tierPrice =
              product?.tier_pricing?.[userTier] ||
              product?.tier_pricing?.member ||
              product?.price ||
              0

            const imageSrc = getProductImage(product, headerImage)
            const isFavorite = favoriteIds.has(product.id)
            const isFavoriteLoading = favoriteLoadingId === product.id
            const isAdding = addingId === product.id
            const isBuying = checkoutLoadingId === product.id
            const ratingValue = Number(product?.rating ?? 0)
            const ratingCount = Number(product?.rating_count ?? 0)
            const stockValue = Number(product?.available_stock ?? 0)
            const badgeLabel = getBadgeLabel(product)
            const isOutOfStock = stockValue <= 0

            return (
              <motion.div
                key={product.id}
                onMouseEnter={() => {
                  if (!detailPrefetchedIdsRef.current.has(product.id)) {
                    router.prefetch(`/customer/category/product/detail?id=${product.id}`)
                    detailPrefetchedIdsRef.current.add(product.id)
                  }
                }}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.03 }}
                className="group overflow-hidden rounded-[22px] border border-fuchsia-700/70 bg-black shadow-[0_0_0_1px_rgba(168,85,247,0.06)] transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.18)]"
              >
                <div className="relative">
                  <div className="relative aspect-[16/7.5] w-full overflow-hidden">
                    <Image
                      src={imageSrc}
                      alt={product?.name || "Product"}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>

                  <button
                    onClick={() => toggleFavorite(product.id)}
                    disabled={isFavoriteLoading}
                    aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                    className={cn(
                      "absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition",
                      isFavorite
                        ? "border-pink-500/70 bg-pink-500/20 text-pink-300"
                        : "border-white/15 bg-black/45 text-white hover:border-fuchsia-500/70 hover:text-fuchsia-300"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-4.5 w-4.5",
                        isFavorite ? "fill-current" : ""
                      )}
                    />
                  </button>
                </div>

                <div className="bg-black p-4 sm:p-5">
                  <h3 className="line-clamp-2 text-xl font-bold leading-snug text-white">
                    {product?.name || "Tanpa nama produk"}
                  </h3>

                  <p className="mt-1 text-sm text-white/75">
                    {stockValue <= 0 ? "Stok Habis" : `Stok Tersedia ${stockValue}`}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-sm text-yellow-400">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.round(ratingValue)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-white/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">
                      ({Number.isFinite(ratingCount) && ratingCount > 0 ? ratingCount : 0})
                    </span>
                    <span className="sr-only">Rating {ratingValue.toFixed(1)}</span>
                  </div>

                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      {tieredPriceLabel}
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-white">
                      {formatPrice(tierPrice)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <span className="rounded-md bg-gradient-to-r from-violet-700 to-fuchsia-600 px-3 py-1 text-xs font-medium text-white shadow-lg shadow-fuchsia-900/30">
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => buyNow(product.id)}
                      disabled={isBuying || isAdding || isOutOfStock}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBuying ? "Memproses..." : "Beli Sekarang"}
                    </button>

                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={isAdding || isBuying || isOutOfStock}
                      aria-label="Tambah ke keranjang"
                      className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-xl border border-fuchsia-600/70 bg-transparent text-white transition hover:bg-fuchsia-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAdding ? <span className="text-xs">...</span> : <ShoppingCart className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && !showMaintenance && !loading && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-600/40 px-4 py-2 text-sm text-white transition hover:bg-fuchsia-600/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </button>

          <div className="rounded-xl border border-fuchsia-700/30 bg-[#100316] px-4 py-2 text-sm text-white/80">
            Halaman <span className="font-semibold text-white">{currentPage}</span> / {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-600/40 px-4 py-2 text-sm text-white transition hover:bg-fuchsia-600/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  )
}