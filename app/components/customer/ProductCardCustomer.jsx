"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProductCardCustomer({ product }) {
  if (!product) {
    return <SkeletonVariant />;
  }

  const pricing =
    Array.isArray(product.tier_pricing)
      ? product.tier_pricing[0]
      : product.tier_pricing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.03 }}
      className="group rounded-2xl border border-purple-700 bg-black overflow-hidden relative"
    >
      {/* Glow Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/10 blur-2xl" />

      {/* IMAGE */}
      <div className="h-[160px] bg-white relative">
        <Image
          src={
            product?.subcategory?.image_url ||
            "/placeholder.png"
          }
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      {/* INFO */}
      <div className="p-4 relative">
        <h3 className="font-semibold mb-1 line-clamp-1">
          {product.name}
        </h3>

        <p className="text-xs text-gray-400 mb-1">
          Stok Tersedia {product.stock ?? 0}
        </p>

        {/* RATING */}
        <div className="flex items-center text-yellow-400 text-sm mb-2">
          ★★★★★
          <span className="ml-1">(247)</span>
        </div>

        {/* PRICE + BADGE */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-white">
            Rp {pricing?.member?.toLocaleString() || "-"}
          </span>

          <span className="text-xs px-2 py-1 rounded bg-purple-800 text-purple-200">
            {product.type || "Otomatis"}
          </span>
        </div>

        {/* ACTION */}
        <div className="flex gap-2">
          <Link
            href="/login"
            className="flex-1 text-center rounded-lg bg-purple-600 py-2 text-sm font-semibold hover:bg-purple-700 transition"
          >
            Beli Sekarang
          </Link>

          <Link
            href="/customer/category/product/detail/cart"
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-purple-600 hover:bg-purple-600/20 transition"
            title="Masukkan ke Keranjang"
          >
            🛒
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonVariant() {
  return (
    <div className="rounded-2xl border border-purple-700 bg-black overflow-hidden animate-pulse">
      <div className="h-[160px] bg-zinc-800" />

      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
