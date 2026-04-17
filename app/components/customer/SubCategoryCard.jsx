"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function ProductCard({ subcategory }) {
  const router = useRouter()

  if (!subcategory) {
    return <SkeletonCard />
  }

  const handleClick = () => {
    if (!subcategory?.id) return

    router.push(
      `/customer/category/product?subcategory_id=${encodeURIComponent(
        String(subcategory.id)
      )}`
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.03 }}
      onClick={handleClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black shadow-lg"
    >
      <div className="absolute inset-0 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100 bg-purple-500/10" />

      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={subcategory?.image_url || "/logogrowtech.png"}
          alt={subcategory?.name || "Subcategory"}
          fill
          className="object-cover transition duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="relative space-y-2 p-5">
        <h3 className="line-clamp-1 text-lg font-semibold text-white">
          {subcategory?.name}
        </h3>

        <p className="line-clamp-1 text-sm text-zinc-400">
          {subcategory?.provider || subcategory?.description || "-"}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          className="mt-2 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-purple-500 hover:shadow-purple-500/40"
        >
          Lihat Produk
        </button>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black">
      <div className="h-48 w-full bg-zinc-800" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-800" />
        <div className="h-10 w-full rounded-lg bg-zinc-800" />
      </div>
    </div>
  )
}