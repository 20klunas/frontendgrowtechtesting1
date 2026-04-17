"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProductCard({ subcategory }) {
  const router = useRouter();

  if (!subcategory) {
    return <SkeletonCard />;
  }

  const handleViewProducts = () => {
    if (!subcategory?.id) return;
    router.push(`/products?subcategory_id=${subcategory.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.03 }}
      className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 shadow-lg"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/10 blur-2xl" />

      <div className="relative w-full h-48 overflow-hidden">
        <Image
          src={subcategory?.image_url || "/logogrowtech.png"}
          alt={subcategory?.name || "Subcategory"}
          fill
          className="object-cover group-hover:scale-110 transition duration-700"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="relative p-5 space-y-3">
        <h3 className="text-lg font-semibold text-white line-clamp-1">
          {subcategory?.name}
        </h3>

        <p className="text-sm text-zinc-400 line-clamp-1">
          {subcategory?.provider}
        </p>

        <button
          onClick={handleViewProducts}
          className="mt-2 w-full rounded-lg bg-purple-600 hover:bg-purple-500 transition py-2.5 text-sm font-medium text-white shadow-md hover:shadow-purple-500/40"
        >
          Lihat Produk
        </button>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 animate-pulse">
      <div className="w-full h-48 bg-zinc-800" />

      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-zinc-800 rounded" />
        <div className="h-3 w-1/2 bg-zinc-800 rounded" />

        <div className="h-10 w-full bg-zinc-800 rounded-lg mt-3" />
      </div>
    </div>
  );
}
