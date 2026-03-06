'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

const GAP = 40
const SPRING = { type: "spring", stiffness: 120, damping: 22 }

export default function BannerCarousel({
  banners = [],
  autoplay = true,
  autoplayDelay = 4000,
  pauseOnHover = true,
  loop = true
}) {

  const containerRef = useRef(null)

  const [position, setPosition] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const itemWidth = 900
  const trackOffset = itemWidth + GAP

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

      {/* Dynamic glow background */}

      <motion.div
        animate={{
          background: `radial-gradient(circle at ${mouse.x * 100}% ${
            mouse.y * 100
          }%, rgba(168,85,247,0.35), transparent 60%)`
        }}
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
          className="flex"
          animate={{
            x: centerOffset - position * trackOffset
          }}
          transition={SPRING}
          style={{ gap: GAP }}
        >

          {renderItems.map((banner, i) => {

            const isActive =
              (i - 1 + extended.length) % extended.length === activeIndex

            const tiltX = (mouse.y - 0.5) * 10
            const tiltY = (mouse.x - 0.5) * -10

            return (
              <motion.div
                key={banner.id + "-" + i}
                className="relative shrink-0"
                animate={{
                  scale: isActive ? 1 : 0.8,
                  opacity: isActive ? 1 : 0.4,
                  y: isActive ? 0 : 40
                }}
                style={{
                  width: itemWidth,
                  height: 360,
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
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full rounded-3xl overflow-hidden group"
                >

                  <Image
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />

                  {/* blur cinematic overlay */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* banner content */}

                  <div className="absolute bottom-8 left-8">

                    {banner.title && (
                      <h3 className="text-3xl font-bold mb-3 text-white drop-shadow-lg">
                        {banner.title}
                      </h3>
                    )}

                    {banner.subtitle && (
                      <p className="text-gray-300 mb-4 max-w-sm">
                        {banner.subtitle}
                      </p>
                    )}

                    {banner.link_url && (
                      <Link
                        href={banner.link_url}
                        className="inline-block px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg shadow-purple-900/40 transition"
                      >
                        Lihat Promo
                      </Link>
                    )}

                  </div>

                  {/* glow highlight */}

                  {isActive && (
                    <div className="absolute inset-0 shadow-[0_0_120px_rgba(168,85,247,0.55)]" />
                  )}

                </motion.div>

              </motion.div>
            )
          })}
        </motion.div>

        {/* indicators */}

        <div className="flex justify-center mt-12 gap-3">

          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setPosition(i + 1)}
              className={`h-[10px] rounded-full transition-all ${
                activeIndex === i
                  ? "w-8 bg-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.9)]"
                  : "w-3 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}