"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function BannerCarousel({
  banners = [],
  autoplay = true,
  autoplayDelay = 4500
}) {

  const [index, setIndex] = useState(0)

  useEffect(() => {

    if (!autoplay) return
    if (banners.length <= 1) return

    const timer = setInterval(() => {

      setIndex(i => (i + 1) % banners.length)

    }, autoplayDelay)

    return () => clearInterval(timer)

  }, [banners.length, autoplay, autoplayDelay])

  if (!banners.length) return null

  const banner = banners[index]

  return (

    <section className="relative py-24">

      <div
        key={banner.id}
        className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden transition-opacity duration-500"
      >

        <Image
          src={banner.image_url}
          alt={banner.title || "Banner"}
          width={1200}
          height={420}
          sizes="(max-width:768px) 100vw, 1200px"
          className="object-cover w-full h-[420px]"
          priority={index === 0}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-10 left-10 right-10">

          {banner.title && (
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {banner.title}
            </h3>
          )}

          {banner.subtitle && (
            <p className="text-gray-300 mb-5 max-w-md">
              {banner.subtitle}
            </p>
          )}

          {banner.link_url && (
            <Link
              href={banner.link_url}
              className="inline-block px-7 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold"
            >
              Lihat Promo
            </Link>
          )}

        </div>

      </div>

      {/* indicators */}

      <div className="flex justify-center mt-8 gap-3">

        {banners.map((_, i) => (

          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition ${
              index === i
                ? "w-8 h-[10px] bg-purple-500"
                : "w-3 h-[10px] bg-white/30"
            }`}
          />

        ))}

      </div>

    </section>

  )

}