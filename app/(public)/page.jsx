import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import BannerCarouselClient from "../components/customer/BannerCarouselClient"
// const BannerCarousel = dynamic(
//   () => import("../components/customer/BannerCarousel"),
//   {
//     ssr: false,
//     loading: () => <BannerCarouselFallback />,
//   }
// )

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    if (row?.key) {
      acc[row.key] = row.value
    }
    return acc
  }, {})

async function getPublicJson(path, revalidate = 120) {
  if (!API) return null

  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate },
    })

    if (!res.ok) {
      return null
    }

    const contentType = res.headers.get("content-type") || ""

    if (!contentType.includes("application/json")) {
      return null
    }

    return await res.json()
  } catch {
    return null
  }
}

async function getHomePageData() {
  const [bannerRes, settingsRes] = await Promise.all([
    getPublicJson("/api/v1/content/banners", 60),
    getPublicJson("/api/v1/content/settings?group=website", 300),
  ])

  const settings = normalizeSettings(settingsRes?.data || [])
  const brand = settings.brand || {}
  const banners = bannerRes?.data || []

  return { brand, banners }
}

export default async function HomePage() {
  const { brand, banners } = await getHomePageData()

  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-black text-white">
      <section className="w-full py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              {brand.site_name || "Growtech Central"}
              <br />
              <span className="text-purple-400">
                {brand.home_subtitle || "Toko Digital Terpercaya"}
              </span>
            </h1>

            {brand.description ? (
              <p className="mt-6 max-w-xl leading-relaxed text-gray-400">
                {brand.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/product"
                className="rounded-lg bg-purple-600 px-6 py-3 font-semibold shadow-lg shadow-purple-900/30 transition hover:bg-purple-700"
              >
                Jelajahi Katalog
              </Link>

              <Link
                href="/faq"
                className="rounded-lg border border-purple-500 px-6 py-3 text-purple-400 transition hover:bg-purple-500/10"
              >
                Informasi Lebih Lanjut
              </Link>
            </div>
          </div>

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

      <section className="w-full pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatItem title="10K+" subtitle="Produk Terjual" />
            <StatItem title="100%" subtitle="Aman & Terpercaya" />
            <StatItem title="24/7" subtitle="Dukungan Pelanggan" />
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-b from-black via-purple-950/20 to-black pt-12 pb-6">
        <BannerCarouselClient banners={banners} autoplay loop />
      </section>
    </main>
  )
}

function StatItem({ title, subtitle }) {
  return (
    <div className="rounded-xl border border-purple-700/40 bg-purple-900/20 py-8 text-center backdrop-blur transition hover:bg-purple-900/30">
      <h3 className="text-3xl font-bold text-purple-400">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
    </div>
  )
}

function BannerCarouselFallback() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[180px] animate-pulse rounded-2xl border border-purple-700/30 bg-purple-900/20"
          />
        ))}
      </div>
    </div>
  )
}