'use client'
export const dynamic = "force-dynamic";
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from "../components/ProductCard"
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

  useEffect(() => {
    fetch(`${API}/api/v1/content/banners`)
      .then(res => res.json())
      .then(res => {
        setBanners(res.data || [])
      })
      .catch(console.error)
  }, [API])

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

  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => {
        const data = normalizeSettings(res?.data)
        setBrand(data.brand || {})
      })
      .catch(console.error)
  }, [API])

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
    <main className="relative min-h-screen bg-black text-white">

      {/* POPUP */}
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

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-8 pt-24 pb-32 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          <div>
            <h1 className="text-5xl font-bold leading-tight">
              {brand?.home_title || "Growtech Central"}
              <br />
              <span className="text-purple-400">
                {brand?.home_subtitle || "Toko Digital Terpercaya"}
              </span>
            </h1>

            {brand?.description && (
              <p className="mt-6 max-w-xl text-gray-300 leading-relaxed">
                {brand.description}
              </p>
            )}

            <div className="mt-8 flex gap-4">
              <Link
                href="/customer/category"
                className="rounded-lg bg-purple-500 px-6 py-3 font-semibold hover:bg-purple-600"
              >
                Jelajahi Katalog
              </Link>

              <Link 
                href="/customer/faq"
                className="rounded-lg border border-purple-500 px-6 py-3 text-purple-400 hover:bg-purple-500/10">
                Informasi Lebih Lanjut
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={420}
              height={420}
              priority
              className="drop-shadow-[0_0_60px_rgba(168,85,247,0.6)]"
            />
          </div>
        </div>

        {/* STATS */}
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-purple-800/60 rounded-xl overflow-hidden">
            {[
              ['10K+', 'Produk Tersedia'],
              ['100%', 'Aman & Terpercaya'],
              ['24/7', 'Dukungan Pelanggan'],
            ].map(([val, label], i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-purple-900/20 to-black"
              >
                <span className="text-2xl font-bold text-purple-400">{val}</span>
                <span className="mt-1 text-sm text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BannerCarousel
        banners={banners || []}
        baseWidth={340}
        autoplay
        loop
      />

      {/* PRODUK POPULER */}
      <section className="mx-auto max-w-7xl px-8 pt-32 pb-40">
        <h2 className="text-3xl font-bold text-purple-400 mb-10">
          Produk Populer
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {loadingProducts ? (
            <>
              <div className="h-52 bg-zinc-800 rounded-xl animate-pulse" />
              <div className="h-52 bg-zinc-800 rounded-xl animate-pulse" />
              <div className="h-52 bg-zinc-800 rounded-xl animate-pulse" />
              <div className="h-52 bg-zinc-800 rounded-xl animate-pulse" />
            </>
          ) : (
            products.map((product) => {

              const price =
                product?.tier_pricing?.member ??
                product?.tier_pricing?.guest ??
                0

              return (
                <Link
                  key={product.id}
                  href={`/customer/category/product/${product.id}`}
                  className="group rounded-2xl border border-purple-700 bg-black overflow-hidden hover:border-purple-500 transition"
                >

                  <div className="relative h-[160px] bg-white">
                    <Image
                      src={product?.subcategory?.image_url || "/placeholder.png"}
                      width={300}
                      height={200}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
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
              )
            })
          )}

        </div>

        {/* tombol lihat semua */}
        <div className="flex justify-center mt-10">
          <Link
            href="/customer/category"
            className="px-6 py-3 rounded-lg border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition"
          >
            Lihat Semua Produk
          </Link>
        </div>
      </section>
    </main>
  )
}
