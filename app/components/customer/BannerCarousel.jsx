'use client'

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function BannerCarousel({
  banners = [],
  autoplay = true,
  autoplayDelay = 4000
}) {
  const [index, setIndex] = useState(0)
  const intervalRef = useRef(null)

  // ✅ autoplay super ringan + aman
  useEffect(() => {
    if (!autoplay || banners.length <= 1) return

    const start = () => {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % banners.length)
      }, autoplayDelay)
    }

    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    start()

    // ✅ pause saat tab tidak aktif (hemat CPU)
    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [autoplay, autoplayDelay, banners.length])

  if (!banners.length) return null

  return (
    <section className="relative w-full overflow-hidden py-16">

      <div className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-2xl">

        {/* ✅ GPU-based animation (SUPER RINGAN) */}
        <div
          className="flex will-change-transform transition-transform duration-500 ease-in-out"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {banners.map((banner, i) => (
            <div
              key={banner.id || i}
              className="relative w-full h-[320px] flex-shrink-0"
            >
              <Image
                src={banner.image_url}
                alt={banner.title || "Banner"}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />

              {/* overlay */}
              <div className="absolute inset-0 bg-black/40" />

              {/* content */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                {banner.title && (
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {banner.title}
                  </h3>
                )}

                {banner.subtitle && (
                  <p className="text-sm text-gray-200 mb-3">
                    {banner.subtitle}
                  </p>
                )}

                {banner.link_url && (
                  <Link
                    href={banner.link_url}
                    className="inline-block px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
                  >
                    Lihat Promo
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* indicators */}
      <div className="flex justify-center mt-6 gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              index === i
                ? "w-6 bg-purple-500"
                : "w-2 bg-gray-400"
            }`}
          />
        ))}
      </div>
    </section>
  )
}