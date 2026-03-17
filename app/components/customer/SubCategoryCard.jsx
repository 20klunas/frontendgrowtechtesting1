"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";

function ProductCard({ subcategory }) {

  const router = useRouter();

  const handleClick = useCallback(() => {

    if (!subcategory?.id) return;

    router.push(
      `/customer/category/product?subcategory=${subcategory.id}`,
      { scroll: true }
    );

  }, [router, subcategory?.id]);


  if (!subcategory) {
    return <SkeletonCard />;
  }

  return (

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className="
        group
        cursor-pointer
        relative
        rounded-2xl
        overflow-hidden
        bg-gradient-to-b
        from-zinc-900
        to-black
        border
        border-zinc-800
        shadow-lg
      "
    >

      {/* Glow */}

      <div
        className="
          absolute
          inset-0
          opacity-0
          group-hover:opacity-100
          transition
          duration-500
          bg-purple-500/10
          blur-2xl
        "
      />

      {/* IMAGE */}

      <div className="relative w-full h-48 overflow-hidden">

        <Image
          src={subcategory.image_url || "/placeholder.png"}
          alt={subcategory.name || "Subcategory"}
          fill
          sizes="(max-width: 768px) 100vw,
                 (max-width: 1200px) 50vw,
                 33vw"
          className="
            object-cover
            transition-transform
            duration-700
            group-hover:scale-110
          "
          priority={false}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      </div>

      {/* CONTENT */}

      <div className="relative p-5 space-y-2">

        <h3 className="text-lg font-semibold text-white line-clamp-1">
          {subcategory.name}
        </h3>

        <p className="text-sm text-zinc-400 line-clamp-1">
          {subcategory.provider}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="
            mt-2
            w-full
            rounded-lg
            bg-purple-600
            hover:bg-purple-500
            transition
            py-2.5
            text-sm
            font-medium
            text-white
            shadow-md
            hover:shadow-purple-500/40
          "
        >
          Lihat Produk
        </button>

      </div>

    </motion.div>

  );
}


export default memo(ProductCard);



function SkeletonCard() {

  return (

    <div
      className="
        rounded-2xl
        overflow-hidden
        bg-gradient-to-b
        from-zinc-900
        to-black
        border
        border-zinc-800
        animate-pulse
      "
    >

      <div className="w-full h-48 bg-zinc-800" />

      <div className="p-5 space-y-3">

        <div className="h-4 w-3/4 bg-zinc-800 rounded" />

        <div className="h-3 w-1/2 bg-zinc-800 rounded" />

        <div className="h-10 w-full bg-zinc-800 rounded-lg" />

      </div>

    </div>

  );

}