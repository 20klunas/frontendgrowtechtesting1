"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { authFetch } from "../../lib/authFetch"
import { notifyCustomerCartChanged } from "../../lib/customerCartEvents"
import { useAuth } from "../../hooks/useAuth"
import useCatalogAccess from "../../hooks/useCatalogAccess"

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

  const handleBuyNow = async (productId) => {
    try {
      if (!user) {
        router.push("/login")
        return
      }

      setBuyingId(productId)

      await authFetch("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          qty: 1,
        }),
        revalidate: 10,
      })

      await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          voucher_code: null,
        }),
        revalidate: 10,
      })

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
                </div>

                <div className="p-4">
                  <h3 className="mb-2 font-semibold">{product?.name}</h3>

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
                    onClick={() => handleBuyNow(product?.id)}
                    disabled={isBuying}
                    className="mt-3 block w-full rounded-lg bg-purple-600 py-2 text-center text-sm transition hover:bg-purple-700 disabled:opacity-60"
                  >
                    {isBuying ? "Memproses..." : "Beli"}
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