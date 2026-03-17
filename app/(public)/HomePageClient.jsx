"use client"

import Image from "next/image"
import Link from "next/link"
import BannerCarousel from "../components/customer/BannerCarousel"

export default function HomePageClient({ brand, banners }) {

  return (

    <main className="w-full min-h-screen bg-black text-white overflow-x-hidden">

      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}

      <section className="w-full py-24">

        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-16">

          {/* LEFT */}

          <div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">

              {brand.site_name || "Growtech Central"}

              <br/>

              <span className="text-purple-400">
                {brand.home_subtitle || "Toko Digital Terpercaya"}
              </span>

            </h1>

            {brand.description && (

              <p className="mt-6 text-gray-400 max-w-xl leading-relaxed">
                {brand.description}
              </p>

            )}

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href="/product"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition shadow-lg shadow-purple-900/30"
              >
                Jelajahi Katalog
              </Link>

              <Link
                href="/faq"
                className="px-6 py-3 border border-purple-500 rounded-lg text-purple-400 hover:bg-purple-500/10 transition"
              >
                Informasi Lebih Lanjut
              </Link>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex justify-center lg:justify-end">

            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={420}
              height={420}
              priority
              className="drop-shadow-[0_0_60px_rgba(168,85,247,0.7)]"
            />

          </div>

        </div>

      </section>

      {/* ============================================ */}
      {/* STATS */}
      {/* ============================================ */}

      <section className="w-full pb-20">

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <StatItem title="10K+" subtitle="Produk Tersedia"/>
            <StatItem title="100%" subtitle="Aman & Terpercaya"/>
            <StatItem title="24/7" subtitle="Dukungan Pelanggan"/>

          </div>

        </div>

      </section>

      {/* ============================================ */}
      {/* BANNER SECTION */}
      {/* ============================================ */}

      <section className="w-full pt-12 pb-6 bg-gradient-to-b from-black via-purple-950/20 to-black">

        <BannerCarousel
          banners={banners || []}
          autoplay
          loop
        />

      </section>

    </main>

  )

}

/* ============================================ */
/* STAT COMPONENT */
/* ============================================ */

function StatItem({title, subtitle}) {

  return (

    <div className="text-center rounded-xl bg-purple-900/20 border border-purple-700/40 py-8 hover:bg-purple-900/30 transition backdrop-blur">

      <h3 className="text-3xl font-bold text-purple-400">
        {title}
      </h3>

      <p className="text-gray-400 text-sm mt-2">
        {subtitle}
      </p>

    </div>

  )

}