'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

const GAP = 40

const SPRING = {
  type: "spring",
  stiffness: 90,
  damping: 22
}

// simple throttle via requestAnimationFrame
function useRafThrottle(callback) {
  const raf = useRef(null)

  return (...args) => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      callback(...args)
      raf.current = null
    })
  }
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

  // ✅ Debounce resize
  useEffect(() => {
    let timeout

    const handleResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setWidth(window.innerWidth)
      }, 150)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ✅ Extend banners (unchanged logic)
  const extended = useMemo(() => {
    if (banners.length >= 3) return banners
    return [...banners, ...banners, ...banners]
  }, [banners])

  const renderItems = useMemo(() => {
    if (!loop) return extended
    return [extended[extended.length - 1], ...extended, extended[0]]
  }, [extended, loop])

  const activeIndex =
    (position - 1 + extended.length) % extended.length

  // ✅ Autoplay optimized
  useEffect(() => {
    if (!autoplay) return
    if (pauseOnHover && hovered) return

    const t = setInterval(() => {
      setPosition((p) => p + 1)
    }, autoplayDelay)

    return () => clearInterval(t)
  }, [hovered, autoplay, autoplayDelay, pauseOnHover])

  const centerOffset =
    typeof window !== "undefined"
      ? window.innerWidth / 2 - itemWidth / 2
      : 0

  // ✅ Throttled mouse move
  const handleMouseMove = useRafThrottle((e) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setMouse({ x, y })
  })

  if (!banners.length) return null

  return (
    <section className="relative py-28 overflow-hidden">

      {/* ✅ Glow (dikurangi intensitas update) */}
      <motion.div
        animate={{
          background: `radial-gradient(circle at ${mouse.x * 100}% ${mouse.y * 100}%,
          rgba(168,85,247,0.18),
          transparent 65%)`
        }}
        transition={{ duration: 0.6 }}
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

            // ✅ Kurangi tilt intensity
            const tiltX = (mouse.y - 0.5) * 6
            const tiltY = (mouse.x - 0.5) * -6

            return (
              <motion.div
                key={banner.id + "-" + i}
                className="relative shrink-0"
                animate={{
                  scale: isActive ? 1 : 0.85,
                  opacity: isActive ? 1 : 0.5,
                  y: isActive ? 0 : 40
                }}
                transition={{ duration: 0.4 }}
                style={{
                  width: itemWidth,
                  height: 380,
                  perspective: 1000
                }}
              >

                <motion.div
                  animate={
                    isActive
                      ? {
                          rotateX: tiltX,
                          rotateY: tiltY
                        }
                      : { rotateX: 0, rotateY: 0 }
                  }
                  transition={{ duration: 0.4 }}
                  className="relative w-full h-full rounded-3xl overflow-hidden group border border-white/10"
                >

                  {/* ✅ Priority hanya untuk aktif */}
                  <Image
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    fill
                    priority={isActive}
                    sizes="(max-width: 768px) 90vw, 1000px"
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

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

                  {/* ✅ Glow hanya active */}
                  {isActive && (
                    <div className="absolute inset-0 shadow-[0_0_60px_rgba(168,85,247,0.35)] pointer-events-none" />
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
                  ? "w-8 h-[10px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                  : "w-3 h-[10px] bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}

        </div>

      </div>
    </section>
  )
}