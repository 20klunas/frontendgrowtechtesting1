"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { authFetch } from "../../lib/authFetch"
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
  const {
    catalogDisabled,
    catalogMessage,
    loading: accessLoading,
  } = useCatalogAccess()

  const [favorites] = useState(Array.isArray(initialFavorites) ? initialFavorites : [])
  const [buyingId, setBuyingId] = useState(null)

  useEffect(() => {
    if (initialUnauthorized && !authLoading) {
      router.replace("/login")
    }
  }, [initialUnauthorized, authLoading, router])

  const handleBuyNow = async (productId, stock) => {
    if (stock <= 0){
      alert("Stok habis")
      return
    }
    try {
      if (!user) {
        router.push("/login")
        return
      }

      setBuyingId(productId)

      await fetcher("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          qty: 1,
        }),
      }, { auth: true })

      await fetcher("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          voucher_code: null,
        }),
      }, { auth: true }),

      notifyCustomerCartChanged()
      router.push("/customer/category/product/detail/lengkapipembelian")
    } catch (err) {
      console.error("Buy now error:", err)
      alert(err.message || "Terjadi kesalahan")
    } finally {
      setBuyingId(null)
    }
  }

  if (accessLoading) {
    return (
      <section className="max-w-6xl mx-auto px-8 py-10 text-white">
        <p className="text-white/60">Cek ketersediaan...</p>
      </section>
    )
  }

  if (catalogDisabled) {
    return (
      <section className="max-w-6xl mx-auto px-8 py-10 text-white">
        <p className="text-red-400">
          {catalogMessage ||
            "Katalog sedang maintenance atau Anda tidak memiliki akses untuk melihat katalog."}
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
            const product = fav.product
            const isBuying = buyingId === product?.id
            const stockValue = Number(product?.available_stock ?? 0)
            const isOutOfStock = stockValue <= 0

            return (
              <div
                key={fav.id}
                className="overflow-hidden rounded-2xl border border-purple-700 bg-black"
              >
                <div className="relative h-[160px] bg-white">
                  <Image
                    src={product?.subcategory?.image_url || "/placeholder.png"}
                    fill
                    alt={product?.name || "Product"}
                    className="object-cover"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                      <span className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        STOK HABIS
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-2 font-semibold">{product?.name}</h3>
                  <p className="text-sm text-white/70">
                    Stok: {stockValue}
                  </p>

                  <div className="mb-2 flex items-center text-sm text-yellow-400">
                    <span className="mr-1">
                      {"★".repeat(Math.round(product?.rating || 0))}
                      {"☆".repeat(5 - Math.round(product?.rating || 0))}
                    </span>

                    <span className="text-xs text-gray-400">
                      {Number(product?.rating || 0).toFixed(1)} ({product?.rating_count || 0})
                    </span>
                  </div>

                  <button
                    onClick={() => !isOutOfStock && handleBuyNow(product?.id, stockValue)}
                    disabled={isBuying || isOutOfStock}
                    className={`
                      mt-3 block w-full rounded-lg py-2 text-center text-sm transition
                      ${isOutOfStock 
                        ? "bg-gray-600 cursor-not-allowed" 
                        : "bg-purple-600 hover:bg-purple-700"}
                      disabled:opacity-60
                    `}
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