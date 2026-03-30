"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { notifyCustomerCartChanged } from "../../lib/customerCartEvents"
import { useAuth } from "../../hooks/useAuth"
import useCatalogAccess from "../../hooks/useCatalogAccess"
import { fetcher } from "../../lib/fetcher"

export default function FavoritesClient({
  initialFavorites = [],
  initialUnauthorized = false,
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { catalogDisabled, catalogMessage, loading: accessLoading } = useCatalogAccess()

  const [favorites, setFavorites] = useState([])
  const [productMap, setProductMap] = useState({})
  const [buyingId, setBuyingId] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔐 redirect kalau unauthorized
  useEffect(() => {
    if (initialUnauthorized && !authLoading) {
      router.replace("/login")
    }
  }, [initialUnauthorized, authLoading, router])

  // 🔥 ambil product realtime
  const loadProducts = useCallback(async (favoritesData) => {
    try {
      const ids = favoritesData.map(f => f.product_id).filter(Boolean)

      if (ids.length === 0) {
        setProductMap({})
        return
      }

      const json = await fetcher(
        `/api/v1/products?ids=${ids.join(",")}`,
        {},
        { force: true }
      )

      const items = json?.data?.data || []

      const map = {}
      for (const item of items) {
        map[item.id] = item
      }

      setProductMap(map)
    } catch (err) {
      console.error("loadProducts error:", err)
    }
  }, [])

  // 🔥 load favorites + sync products
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true)

      const json = await fetcher(
        "/api/v1/favorites?per_page=50",
        {},
        { auth: true, force: true }
      )

      const data = json?.data?.data || []

      setFavorites(data)
      await loadProducts(data)

    } catch (err) {
      console.error("loadFavorites error:", err)
    } finally {
      setLoading(false)
    }
  }, [loadProducts])

  // 🚀 initial load
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // 🔄 optional: refresh saat tab focus
  useEffect(() => {
    const onFocus = () => loadFavorites()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loadFavorites])

  // 🛒 BUY NOW (SAFE & SYNC)
  const handleBuyNow = async (productId, stock) => {
    if (stock <= 0) {
      alert("Stok habis")
      return
    }

    if (!user) {
      router.push("/login")
      return
    }

    try {
      setBuyingId(productId)

      await fetcher("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          qty: 1,
        }),
      }, { auth: true })

      const checkout = await fetcher("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({ voucher_code: null }),
      }, { auth: true })

      if (!checkout?.success) {
        throw new Error("Checkout gagal")
      }

      // 🔥 WAJIB: refresh data biar stock sync
      await loadFavorites()

      notifyCustomerCartChanged()
      router.push("/customer/category/product/detail/lengkapipembelian")

    } catch (err) {
      console.error("Buy error:", err)
      alert(err.message || "Terjadi kesalahan")
    } finally {
      setBuyingId(null)
    }
  }

  // 🧱 UI STATES
  if (accessLoading || loading) {
    return (
      <section className="max-w-6xl mx-auto px-8 py-10 text-white">
        <p className="text-white/60">Memuat...</p>
      </section>
    )
  }

  if (catalogDisabled) {
    return (
      <section className="max-w-6xl mx-auto px-8 py-10 text-white">
        <p className="text-red-400">
          {catalogMessage || "Katalog tidak tersedia"}
        </p>
      </section>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-8 py-10 text-white">
      <h1 className="mb-8 text-2xl font-bold">❤️ Produk Favorit Saya</h1>

      {favorites.length === 0 ? (
        <p className="text-white/60">Belum ada produk favorit.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {favorites.map((fav) => {
            const product = productMap[fav.product_id] || fav.product

            const stockValue = Number(product?.available_stock ?? 0)
            const isOutOfStock = stockValue <= 0
            const isBuying = buyingId === product?.id

            return (
              <div key={fav.id} className="rounded-2xl border border-purple-700 bg-black">
                <div className="relative h-[160px] bg-white">
                  <Image
                    src={product?.subcategory?.image_url || "/placeholder.png"}
                    fill
                    alt={product?.name || "Product"}
                    className="object-cover"
                  />

                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <span className="bg-red-600 px-3 py-1 text-xs font-bold text-white rounded">
                        STOK HABIS
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold">{product?.name}</h3>

                  <p className="text-sm text-white/70">
                    Stok: {stockValue}
                  </p>

                  <button
                    onClick={() => handleBuyNow(product.id, stockValue)}
                    disabled={isBuying || isOutOfStock}
                    className={`mt-3 w-full py-2 rounded-lg text-sm ${
                      isOutOfStock
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {isOutOfStock
                      ? "Stok Habis"
                      : isBuying
                      ? "Memproses..."
                      : "Beli"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}