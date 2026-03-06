'use client'
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from "framer-motion"
import BannerCarousel from "../components/customer/BannerCarousel"
import Popup from "../components/customer/Popup"

const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

export default function CustomerHomePage() {

  const API = process.env.NEXT_PUBLIC_API_URL

  const [popup, setPopup] = useState(null)
  const [open, setOpen] = useState(true)
  const [brand, setBrand] = useState({})
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  /* ================= BANNERS ================= */

  useEffect(() => {
    fetch(`${API}/api/v1/content/banners`)
      .then(res => res.json())
      .then(res => {
        setBanners(res.data || [])
      })
      .catch(console.error)
  }, [API])

  /* ================= POPUP ================= */

  useEffect(() => {
    fetch(`${API}/api/v1/content/popup`)
      .then(res => res.json())
      .then(res => {
        if (res?.data?.is_active) {
          setPopup(res.data)
          setOpen(true)
        }
      })
      .catch(console.error)
  }, [API])

  /* ================= SETTINGS ================= */

  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => {
        const data = normalizeSettings(res?.data)
        setBrand(data.brand || {})
      })
      .catch(console.error)
  }, [API])

  /* ================= POPULAR PRODUCTS ================= */

  useEffect(() => {

    const fetchPopularProducts = async () => {
      try {

        setLoadingProducts(true)

        const res = await fetch(`${API}/api/v1/products?sort=popular&per_page=4`)
        const json = await res.json()

        if (json.success) {
          setProducts(json?.data?.data || [])
        } else {
          setProducts([])
        }

      } catch (err) {

        console.error("Failed fetch popular products:", err)
        setProducts([])

      } finally {

        setLoadingProducts(false)

      }
    }

    fetchPopularProducts()

  }, [API])

  return (

    <main className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* ================= POPUP ================= */}

      {popup && open && popup?.is_active && (
        <Popup
          title={popup?.title}
          content={popup?.content}
          image={popup?.image_url}
          ctaText={popup?.cta_text}
          ctaUrl={popup?.cta_url}
          onClose={() => setOpen(false)}
        />
      )}

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden">

        {/* animated glow background */}

        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-700/20 blur-[200px] rounded-full pointer-events-none"/>

        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-28 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* LEFT */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">

              <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {brand?.home_title || "Growtech Central"}
              </span>

              <br />

              <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                {brand?.home_subtitle || "Toko Digital Terpercaya"}
              </span>

            </h1>

            {brand?.description && (

              <p className="mt-6 max-w-xl text-gray-300 leading-relaxed text-lg">
                {brand.description}
              </p>

            )}

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href="/customer/category"
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold shadow-xl shadow-purple-900/40 transition hover:scale-105"
              >
                Jelajahi Katalog
              </Link>

              <Link
                href="/customer/faq"
                className="border border-purple-500 px-6 py-3 rounded-lg text-purple-300 hover:bg-purple-500/10 transition"
              >
                Informasi Lebih Lanjut
              </Link>

            </div>

          </motion.div>

          {/* RIGHT */}

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center lg:justify-end"
          >

            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={420}
              height={420}
              priority
              className="drop-shadow-[0_0_90px_rgba(168,85,247,0.9)] animate-pulse"
            />

          </motion.div>

        </div>

        {/* ================= STATS ================= */}

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 border border-purple-800/60 rounded-xl overflow-hidden backdrop-blur bg-black/30"
          >

            {[
              ['10K+', 'Produk Tersedia'],
              ['100%', 'Aman & Terpercaya'],
              ['24/7', 'Dukungan Pelanggan'],
            ].map(([val, label], i) => (

              <div
                key={i}
                className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-purple-900/20 to-black hover:bg-purple-900/30 transition"
              >

                <span className="text-3xl font-bold text-purple-400">
                  {val}
                </span>

                <span className="text-sm text-gray-300 mt-1">
                  {label}
                </span>

              </div>

            ))}

          </motion.div>

        </div>

      </section>

      {/* ================= BANNER ================= */}

      <section className="mt-16">

        <BannerCarousel
          banners={banners || []}
          baseWidth={340}
          autoplay
          loop
        />

      </section>

      {/* ================= PRODUK POPULER ================= */}

      <section className="mx-auto max-w-7xl px-6 lg:px-8 pt-24 pb-32">

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-purple-400 mb-10"
        >
          Produk Populer
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {loadingProducts ? (

            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>

          ) : (

            products.map((product) => {

              const price =
                product?.tier_pricing?.member ??
                product?.tier_pricing?.guest ??
                0

              return (

                <motion.div
                  key={product.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ duration: 0.25 }}
                >

                  <Link
                    href={`/customer/category/product/${product.id}`}
                    className="group block rounded-2xl border border-purple-700 bg-gradient-to-b from-zinc-900 to-black overflow-hidden hover:border-purple-500 transition shadow-lg hover:shadow-purple-900/40"
                  >

                    <div className="relative h-[170px] bg-white overflow-hidden">

                      <Image
                        src={product?.subcategory?.image_url || "/placeholder.png"}
                        width={300}
                        height={200}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />

                    </div>

                    <div className="p-4">

                      <h3 className="font-semibold text-white mb-1 line-clamp-1">
                        {product.name}
                      </h3>

                      <p className="text-xs text-gray-400 mb-2">
                        Stok {product.available_stock ?? 0}
                      </p>

                      <div className="flex items-center text-yellow-400 text-sm mb-2">

                        {"★".repeat(Math.round(product.rating || 0))}
                        {"☆".repeat(5 - Math.round(product.rating || 0))}

                        <span className="text-xs text-gray-400 ml-2">
                          ({product.rating_count || 0})
                        </span>

                      </div>

                      <p className="font-bold text-green-400">
                        Rp {price.toLocaleString("id-ID")}
                      </p>

                    </div>

                  </Link>

                </motion.div>

              )

            })

          )}

        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >

          <Link
            href="/customer/category"
            className="px-8 py-3 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
          >
            Lihat Semua Produk
          </Link>

        </motion.div>

      </section>

    </main>

  )

}

function SkeletonCard() {

  return (

    <div className="rounded-2xl border border-purple-700 bg-black overflow-hidden animate-pulse">

      <div className="h-[170px] bg-zinc-800" />

      <div className="p-4 space-y-3">

        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />

      </div>

    </div>

  )

}