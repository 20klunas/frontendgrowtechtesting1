"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  SlidersHorizontal,
  Star,
  ShoppingBag,
  ShieldCheck,
  Clock3,
  PackageSearch,
} from "lucide-react"

function resolveMemberPricing(product) {
  const pricing = product?.tier_pricing || {}

  const final =
    Number(
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
    return `/customer/category/product/detail?id=${encodeURIComponent(
      String(product.id)
    )}`
  }

  if (subcategoryId) {
    return `/products?subcategory_id=${encodeURIComponent(String(subcategoryId))}`
  }

  return "/customer/category"
}

function formatDuration(product) {
  return (
    product?.duration_label ||
    product?.duration ||
    product?.active_period ||
    product?.masa_aktif ||
    "Aktif instan"
  )
}

function formatPrice(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`
}

export default function ProductsContent({
  initialProducts = [],
  initialSubcategoryId = null,
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("terbaru")

  const filteredProducts = useMemo(() => {
    let data = Array.isArray(initialProducts) ? [...initialProducts] : []

    const keyword = search.trim().toLowerCase()
    if (keyword) {
      data = data.filter((product) => {
        const name = String(product?.name || "").toLowerCase()
        const description = String(product?.description || "").toLowerCase()

        return name.includes(keyword) || description.includes(keyword)
      })
    }

    if (sort === "termurah") {
      data.sort(
        (a, b) => resolveMemberPricing(a).final - resolveMemberPricing(b).final
      )
    }

    if (sort === "terbaru") {
      data.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
    }

    return data
  }, [initialProducts, search, sort])

  const handleOpenProduct = (product) => {
    router.push(resolveProductHref(product, initialSubcategoryId))
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.14),_transparent_28%),linear-gradient(to_bottom,_#020617,_#050816_45%,_#020617)] px-4 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {initialSubcategoryId ? "Produk Pilihan" : "Semua Produk"}
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Temukan produk terbaik dengan tampilan clean & profesional.
          </p>
        </motion.div>

        {/* SEARCH + SORT */}
        <div className="mb-8 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:grid-cols-[1fr_220px]">

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"
            />
            <input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 pl-12 pr-4 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 pl-12 pr-4 text-sm text-white outline-none"
            >
              <option value="terbaru">Terbaru</option>
              <option value="termurah">Termurah</option>
            </select>
          </div>
        </div>

        {/* GRID */}
        {filteredProducts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product, i) => {
              const price = resolveMemberPricing(product).final
              const rating = Number(product?.rating || 4.8)
              const duration = formatDuration(product)

              return (
                <motion.div
                  key={product.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -6 }}
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-xl hover:border-purple-500/40 transition"
                >

                  {/* BADGE */}
                  <div className="mb-3 flex justify-between">
                    <span className="text-xs text-purple-400">Populer</span>
                    <ShieldCheck size={14} className="text-emerald-400" />
                  </div>

                  {/* TITLE */}
                  <h3 className="text-lg font-semibold text-white">
                    {product?.name}
                  </h3>

                  {/* DESC */}
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {product?.description}
                  </p>

                  {/* INFO */}
                  <div className="mt-4 flex gap-3 text-xs text-zinc-300">
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" />
                      {rating}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock3 size={14} className="text-purple-300" />
                      {duration}
                    </span>
                  </div>

                  {/* PRICE */}
                  <div className="mt-5">
                    <p className="text-xs text-zinc-500">Harga mulai</p>
                    <p className="text-xl font-bold text-purple-400">
                      {formatPrice(price)}
                    </p>
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={() => handleOpenProduct(product)}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                  >
                    Lihat Detail
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <PackageSearch size={40} className="mx-auto text-purple-400 mb-4" />
      <p className="text-zinc-400">Produk tidak ditemukan</p>
    </div>
  )
}