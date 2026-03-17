"use client"

import dynamic from "next/dynamic"

const BannerCarousel = dynamic(
  () => import("./BannerCarousel"),
  {
    ssr: false,
    loading: () => <BannerCarouselFallback />,
  }
)

export default function BannerCarouselClient(props) {
  return <BannerCarousel {...props} />
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