"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

function resolvePricing(product) {
  const pricing = Array.isArray(product?.tier_pricing) ? product?.tier_pricing[0] : (product?.tier_pricing || {});
  const final = Number(
    pricing?.member ??
      product?.display_price_breakdown?.base_price ??
      product?.display_price ??
      product?.price ??
      0
  ) || 0;

  return { final };
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}

function resolveProductHref(product) {
  const productId = product?.id;
  if (productId) {
    return `/customer/category/product/detail?id=${encodeURIComponent(String(productId))}`;
  }

  const subcategoryId = product?.subcategory_id ?? product?.subcategory?.id ?? null;
  if (subcategoryId) {
    return `/customer/category/product?subcategory_id=${encodeURIComponent(String(subcategoryId))}`;
  }

  return "/customer/category";
}

export default function ProductCardCustomer({ product }) {
  if (!product) {
    return <SkeletonVariant />;
  }

  const pricing = resolvePricing(product);
  const href = resolveProductHref(product);
  const ratingStars = renderStars(product?.rating);
  const ratingCount = Number(product?.rating_count ?? 0);
  const stock = Number(product?.available_stock ?? product?.stock ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.03 }}
      className="group rounded-2xl border border-purple-700 bg-black overflow-hidden relative"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/10 blur-2xl" />

      <Link href={href} className="block">
        <div className="h-[160px] bg-white relative">
          <Image
            src={product?.subcategory?.image_url || "/logogrowtech.png"}
            alt={product?.name || "Produk"}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      <div className="p-4 relative">
        <Link href={href} className="block">
          <h3 className="font-semibold mb-1 line-clamp-1 text-white">
            {product?.name || "Produk"}
          </h3>
        </Link>

        <p className="text-xs text-gray-400 mb-1">
          Stok Tersedia {Number.isFinite(stock) ? stock : 0}
        </p>

        <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
          <span>{ratingStars}</span>
          <span className="text-xs text-gray-300">({ratingCount})</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-white">
            Rp {pricing.final.toLocaleString("id-ID")}
          </span>

          <span className="text-xs px-2 py-1 rounded bg-purple-800 text-purple-200">
            {product?.type || "Otomatis"}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={href}
            className="flex-1 text-center rounded-lg bg-purple-600 py-2 text-sm font-semibold hover:bg-purple-700 transition text-white"
          >
            Lihat Detail
          </Link>

          <Link
            href={href}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-purple-600 hover:bg-purple-600/20 transition"
            title="Buka detail produk"
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
