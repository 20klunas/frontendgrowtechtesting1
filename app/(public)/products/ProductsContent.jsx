"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

function resolveMemberPricing(product) {
  const pricing = product?.tier_pricing || {}

  const final = Number(
    pricing?.member ??
    pricing?.reseller ??
    pricing?.vip ??
    product?.display_price_breakdown?.base_price ??
    product?.display_price ??
    product?.price ??
    0
  ) || 0

  return { final }
}

function resolveProductHref(product, subcategoryId) {
  if (product?.id) {
    return `/customer/category/product/detail?id=${encodeURIComponent(String(product.id))}`
  }

  if (subcategoryId) {
    return `/products?subcategory_id=${encodeURIComponent(String(subcategoryId))}`
  }

  return "/customer/category"
}

export default function ProductsContent({ initialProducts = [], initialSubcategoryId = null }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("terbaru")

  const filteredProducts = useMemo(() => {
    let data = Array.isArray(initialProducts) ? [...initialProducts] : []

    const keyword = search.trim().toLowerCase()
    if (keyword) {
      data = data.filter((product) =>
        String(product?.name || "").toLowerCase().includes(keyword)
      )
    }

    if (sort === "termurah") {
      data.sort((a, b) => resolveMemberPricing(a).final - resolveMemberPricing(b).final)
    }

    if (sort === "terbaru") {
      data.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
    }

    if (sort === "terlaris") {
      data.sort((a, b) => Number(b?.purchases_count ?? b?.sold ?? 0) - Number(a?.purchases_count ?? a?.sold ?? 0))
    }

    if (sort === "favorite") {
      data.sort((a, b) => Number(b?.favorites_count || 0) - Number(a?.favorites_count || 0))
    }

    if (sort === "popular") {
      data.sort((a, b) => Number(b?.popularity_score || 0) - Number(a?.popularity_score || 0))
    }

    if (sort === "rating") {
      data.sort((a, b) => Number(b?.rating || 0) - Number(a?.rating || 0))
    }

    return data
  }, [initialProducts, search, sort])

  const handleOpenProduct = (product) => {
    router.push(resolveProductHref(product, initialSubcategoryId))
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-8 lg:px-12">
      <motion.h1
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-bold"
      >
        {initialSubcategoryId ? "Produk" : "Semua Produk"}
      </motion.h1>

      <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:flex-row">
        <input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-purple-500 md:w-64"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none md:w-40"
        >
          <option value="terbaru">Terbaru</option>
          <option value="termurah">Termurah</option>
          <option value="terlaris">Terlaris</option>
          <option value="favorite">Favorit</option>
          <option value="popular">Popular</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredProducts.length === 0 ? (
          <EmptyState />
        ) : (
          filteredProducts.map((product, i) => {
            const memberPricing = resolveMemberPricing(product)

            return (
              <motion.div
                key={product.id || `${product?.name || "product"}-${i}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, rotateX: 4, rotateY: -4 }}
                className="group relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-5 shadow-lg transition duration-300 hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 opacity-0 blur-2xl transition group-hover:opacity-100 bg-purple-500/10" />

                <div className="relative flex h-full flex-col">
                  <h3 className="mb-1 text-lg font-semibold">{product?.name}</h3>

                  <p className="line-clamp-2 text-sm text-zinc-400">
                    {product?.description}
                  </p>

                  {product?.duration_days ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Durasi: {product.duration_days} hari
                    </p>
                  ) : null}

                  <div className="mt-4">
                    <p className="text-xs text-zinc-400">Harga mulai</p>
                    <p className="text-xl font-bold text-purple-400">
                      Rp {memberPricing.final.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenProduct(product)}
                    className="mt-auto w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-purple-500 hover:to-purple-400 hover:shadow-purple-500/40"
                  >
                    Lihat Detail
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full py-20 text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
        📦
      </div>

      <p className="text-lg text-zinc-400">Tidak ada produk ditemukan</p>

      <p className="text-sm text-zinc-500">
        Coba ubah filter atau kata kunci pencarian
      </p>
    </div>
  )
}
