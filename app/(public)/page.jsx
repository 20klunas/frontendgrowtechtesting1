'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import BannerCarousel from "../components/customer/BannerCarousel"

const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

export default function HomePage() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const [brand, setBrand] = useState({})
  const [banners, setBanners] = useState([])

  useEffect(() => {
    fetch(`${API}/api/v1/content/banners`)
      .then(res => res.json())
      .then(res => {
        setBanners(res.data || [])
      })
      .catch(console.error)
  }, [API])

  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => {
        const data = normalizeSettings(res?.data)
        setBrand(data.brand || {})
      })
      .catch(console.error)
  }, [API])

  return (
    <main className="home-wrapper text-white">

      {/* ================= HERO ================= */}
      <section className="
        flex flex-col-reverse lg:flex-row
        items-center
        gap-10 lg:gap-20
        px-5 sm:px-8 lg:px-16
        py-10 lg:py-20
      ">
        {/* LEFT */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="
            text-3xl sm:text-4xl lg:text-5xl
            font-bold
            leading-tight
          ">
            {brand.site_name || "Growtech Central"}
            <br />
            <span className="text-purple-400">
              {brand.home_subtitle || "Toko Digital Terpercaya"}
            </span>
          </h1>

          {brand.description && (
            <p className="
              mt-4
              text-gray-400
              text-sm sm:text-base
              max-w-xl
              mx-auto lg:mx-0
            ">
              {brand.description}
            </p>
          )}

          <div className="
            flex flex-col sm:flex-row
            gap-3
            mt-6
            justify-center lg:justify-start
          ">
            <Link
              href="/public/product"
              className="
                btn-primary
                w-full sm:w-auto
                text-center
              "
            >
              Jelajahi Katalog
            </Link>

            <button
              className="
                btn-outline
                w-full sm:w-auto
              "
            >
              Informasi Lebih Lanjut
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex justify-center">
          <Image
            src="/logoherosection.png"
            alt="Growtech Logo"
            width={420}
            height={420}
            priority
            className="
              w-[220px] sm:w-[300px] lg:w-[420px]
              h-auto
              object-contain
            "
          />
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="px-5 sm:px-8 lg:px-16 pb-10">
        <div className="
          grid grid-cols-1 sm:grid-cols-3
          gap-4
          bg-black/40
          border border-purple-800/40
          rounded-2xl
          p-5 sm:p-6
          text-center
        ">
          <StatItem title="10K+" subtitle="Produk Tersedia" />
          <StatItem title="100%" subtitle="Aman & Terpercaya" />
          <StatItem title="24/7" subtitle="Dukungan Pelanggan" />
        </div>
      </section>

      {/* ================= BANNER ================= */}
      <section className="px-2 sm:px-6 lg:px-10 pb-16">
        <BannerCarousel
          banners={banners}
          baseWidth={280} // lebih kecil biar pas mobile
          autoplay
          loop
        />
      </section>

    </main>
  )
}

/* ================= COMPONENT ================= */

function StatItem({ title, subtitle }) {
  return (
    <div className="
      rounded-xl
      bg-purple-900/20
      border border-purple-700/30
      py-4
      hover:bg-purple-900/30
      transition
    ">
      <h3 className="text-xl sm:text-2xl font-bold">
        {title}
      </h3>
      <span className="text-gray-400 text-sm">
        {subtitle}
      </span>
    </div>
  )
}