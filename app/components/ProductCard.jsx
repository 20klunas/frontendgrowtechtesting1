"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ShieldCheck,
  Star,
  Layers3,
} from "lucide-react";

export default function ProductCard({ subcategory }) {
  const router = useRouter();

  if (!subcategory) return <SkeletonCard />;

  const handleViewProducts = () => {
    if (!subcategory?.id) return;
    router.push(`/products?subcategory_id=${subcategory.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_40%)] opacity-0 group-hover:opacity-100 transition duration-500" />

      {/* IMAGE */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={subcategory?.image_url || "/logogrowtech.png"}
          alt={subcategory?.name || "Product"}
          fill
          className="object-cover transition duration-700 group-hover:scale-110"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05010a] via-black/30 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-md border border-purple-400/20 px-3 py-1 text-xs text-purple-200">
          <Layers3 size={13} />
          Digital
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-400/20 px-2.5 py-1 text-xs text-emerald-300">
          <ShieldCheck size={12} />
          Aman
        </div>

        {/* TITLE OVER IMAGE */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white drop-shadow-lg line-clamp-1">
            {subcategory?.name}
          </h3>
          <p className="text-xs text-zinc-300 line-clamp-1">
            {subcategory?.provider || "Provider resmi"}
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative p-5 space-y-4">

        {/* CATEGORY + RATING */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
            {subcategory?.category?.name || "Kategori"}
          </span>


        </div>

        {/* CTA */}
        <button
          onClick={handleViewProducts}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 py-3 text-sm font-semibold text-white transition duration-300 group-hover:shadow-[0_10px_35px_rgba(168,85,247,0.45)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Lihat Produk
            <ChevronRight size={16} />
          </span>

          {/* Shine Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%]" />
        </button>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 animate-pulse">
      <div className="h-52 w-full bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-1/2 bg-white/10 rounded" />
        <div className="h-10 w-full bg-white/10 rounded-2xl mt-4" />
      </div>
    </div>
  );
}