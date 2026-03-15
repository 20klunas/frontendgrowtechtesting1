'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

const GAP = 40

const SPRING = {
  type: "spring",
  stiffness: 110,
  damping: 24
}

export default function BannerCarousel({
  banners = [],
  autoplay = true,
  autoplayDelay = 4500,
  pauseOnHover = true,
  loop = true
}) {

  const containerRef = useRef(null)

  const [position, setPosition] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [width, setWidth] = useState(1200)

  const itemWidth = Math.min(width * 0.75, 1000)
  const trackOffset = itemWidth + GAP

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth)
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const extended = useMemo(() => {
    if (banners.length >= 3) return banners
    return [...banners, ...banners, ...banners]
  }, [banners])

  const renderItems = useMemo(() => {
    if (!loop) return extended
    return [extended[extended.length - 1], ...extended, extended[0]]
  }, [extended])

  const activeIndex =
    (position - 1 + extended.length) % extended.length

  useEffect(() => {

    if (!autoplay) return
    if (pauseOnHover && hovered) return

    const t = setInterval(() => {
      setPosition((p) => p + 1)
    }, autoplayDelay)

    return () => clearInterval(t)

  }, [hovered, autoplay])

  const centerOffset =
    typeof window !== "undefined"
      ? window.innerWidth / 2 - itemWidth / 2
      : 0

  const handleMouseMove = (e) => {

    const rect = containerRef.current.getBoundingClientRect()

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setMouse({ x, y })
  }

  if (!banners.length) return null

  return (

    <section className="relative py-28 overflow-hidden">

      {/* glow background */}

      <motion.div
        animate={{
          background: `radial-gradient(circle at ${mouse.x * 100}% ${mouse.y * 100}%,
          rgba(168,85,247,0.25),
          transparent 60%)`
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0"
      />

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
      >

        <motion.div
          className="flex items-center"
          animate={{
            x: centerOffset - position * trackOffset
          }}
          transition={SPRING}
          style={{ gap: GAP }}
        >

          {renderItems.map((banner, i) => {

            const isActive =
              (i - 1 + extended.length) % extended.length === activeIndex

            const tiltX = (mouse.y - 0.5) * 12
            const tiltY = (mouse.x - 0.5) * -12

            return (

              <motion.div
                key={banner.id + "-" + i}
                className="relative shrink-0"
                animate={{
                  scale: isActive ? 1 : 0.82,
                  opacity: isActive ? 1 : 0.45,
                  y: isActive ? 0 : 50
                }}
                style={{
                  width: itemWidth,
                  height: 380,
                  perspective: 1200
                }}
              >

                <motion.div
                  animate={
                    isActive
                      ? {
                          rotateX: tiltX,
                          rotateY: tiltY
                        }
                      : {}
                  }
                  transition={{ duration: 0.35 }}
                  className="relative w-full h-full rounded-3xl overflow-hidden group border border-white/10"
                >

                  <Image
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />

                  {/* cinematic overlay */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* banner content */}

                  <div className="absolute bottom-10 left-10 right-10">

                    {banner.title && (
                      <h3 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-3">
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
                        className="inline-block px-7 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg shadow-purple-900/40 transition hover:scale-[1.03]"
                      >
                        Lihat Promo
                      </Link>
                    )}

                  </div>

                  {/* premium glow */}

                  {isActive && (
                    <div className="absolute inset-0 shadow-[0_0_80px_rgba(168,85,247,0.45)] pointer-events-none" />
                  )}

                </motion.div>

              </motion.div>

            )
          })}
        </motion.div>

        {/* indicators */}

        <div className="flex justify-center mt-14 gap-3">

          {banners.map((_, i) => (

            <button
              key={i}
              onClick={() => setPosition(i + 1)}
              className={`transition-all duration-300 rounded-full ${
                activeIndex === i
                  ? "w-8 h-[10px] bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.9)]"
                  : "w-3 h-[10px] bg-white/30 hover:bg-white/50"
              }`}
            />

          ))}

        </div>

      </div>

    </section>
  )
}
