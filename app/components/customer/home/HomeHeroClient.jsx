"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWebsiteSettings } from "../../../context/WebsiteSettingsContext";

export default function HomeHeroClient({
  catalogDisabled = false,
  catalogMaintenance = "",
}) {
  const { brand } = useWebsiteSettings();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-700/20 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black/40 to-black pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="text-white">
              {brand?.home_title || "Growtech Central"}
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {brand?.home_subtitle || "Toko Digital Terpercaya"}
            </span>
          </h1>

          {brand?.description && (
            <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-xl">
              {brand.description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            {catalogDisabled ? (
              <button
                disabled
                title={catalogMaintenance}
                className="bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-lg text-zinc-400 cursor-not-allowed"
              >
                Katalog Maintenance
              </button>
            ) : (
              <Link
                href="/customer/category"
                className="px-7 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg shadow-purple-900/40 transition hover:scale-[1.03]"
              >
                Jelajahi Katalog
              </Link>
            )}

            <Link
              href="/customer/faq"
              className="px-7 py-3 rounded-xl border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
            >
              Informasi
            </Link>
          </div>

          {catalogDisabled && (
            <p className="mt-4 text-sm text-amber-300">{catalogMaintenance}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="flex justify-center lg:justify-end"
        >
          <Image
            src="/logoherosection.png"
            alt="Growtech"
            width={420}
            height={420}
            priority
            className="drop-shadow-[0_0_70px_rgba(168,85,247,0.8)]"
          />
        </motion.div>
      </div>
    </section>
  );
}