'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const GAP = 36
const SPRING = { type: 'spring', stiffness: 160, damping: 26 }
const DRAG_BUFFER = 120
const VELOCITY_THRESHOLD = 500

export default function BannerCarousel({
  banners = [],
  baseWidth = 980, // lebih lebar
  autoplay = true,
  autoplayDelay = 4000,
  pauseOnHover = true,
  loop = true,
}) {

  const containerRef = useRef(null)

  const itemWidth =
  typeof window !== "undefined"
    ? Math.min(window.innerWidth * 0.7, baseWidth)
    : baseWidth
  const trackOffset = itemWidth + GAP

  /* ================= DUPLICATE ================= */

  const extendedBanners = useMemo(() => {
    if (banners.length >= 3) return banners
    return [...banners, ...banners, ...banners]
  }, [banners])

  const itemsForRender = useMemo(() => {
    if (!loop || extendedBanners.length === 0) return extendedBanners
    return [
      extendedBanners[extendedBanners.length - 1],
      ...extendedBanners,
      extendedBanners[0],
    ]
  }, [extendedBanners, loop])

  const [position, setPosition] = useState(loop ? 1 : 0)
  const [hovered, setHovered] = useState(false)
  const [jumping, setJumping] = useState(false)

  /* ================= INIT ================= */

  useEffect(() => {
    const start = loop ? 1 : 0
    setPosition(start)
  }, [extendedBanners.length, loop])

  /* ================= AUTOPLAY ================= */

  useEffect(() => {
    if (!autoplay || extendedBanners.length <= 1) return
    if (pauseOnHover && hovered) return

    const timer = setInterval(() => {
      setPosition(prev => prev + 1)
    }, autoplayDelay)

    return () => clearInterval(timer)

  }, [hovered, autoplay, autoplayDelay, extendedBanners.length])

  /* ================= LOOP FIX ================= */

  const handleAnimationComplete = () => {

    if (!loop) return

    if (position === itemsForRender.length - 1) {

      setJumping(true)
      setPosition(1)

      requestAnimationFrame(() => setJumping(false))

    }

    if (position === 0) {

      setJumping(true)

      const target = extendedBanners.length

      setPosition(target)

      requestAnimationFrame(() => setJumping(false))

    }

  }

  /* ================= DRAG ================= */

  const handleDragEnd = (_, info) => {

    const { offset, velocity } = info

    if (offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD) {
      setPosition(prev => prev + 1)
    }

    else if (offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD) {
      setPosition(prev => prev - 1)
    }

  }

  const activeIndex =
    (position - 1 + extendedBanners.length) % extendedBanners.length

  if (!banners.length) return null

  return (

    <section className="relative w-full py-28 overflow-hidden">

      {/* Glow background */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_60%)]" />

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onMouseEnter={() => pauseOnHover && setHovered(true)}
        onMouseLeave={() => pauseOnHover && setHovered(false)}
      >

        <motion.div
          className="flex justify-center cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(position * trackOffset) }}
          transition={jumping ? { duration: 0 } : SPRING}
          style={{ gap: GAP }}
          onAnimationComplete={handleAnimationComplete}
        >

          {itemsForRender.map((banner, i) => {

            const isActive =
              (i - 1 + extendedBanners.length) %
                extendedBanners.length === activeIndex

            return (

              <motion.div
                key={banner.id + '-' + i}
                className="relative shrink-0"
                animate={{
                  scale: isActive ? 1 : 0.82,
                  opacity: isActive ? 1 : 0.45,
                  y: isActive ? 0 : 30,
                  filter: isActive ? "blur(0px)" : "blur(2px)",
                }}
                transition={{ duration: 0.5 }}
                style={{
                  width: itemWidth,
                  height: 260, // lebih pendek dari lebar
                }}
              >

                <Link href={banner.link_url || '#'}>

                  <div className="relative w-full h-full rounded-3xl overflow-hidden group">

                    <Image
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      fill
                      priority
                      unoptimized
                      className="object-cover group-hover:scale-105 transition duration-700"
                    />

                    {/* Cinematic overlay */}

                    <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-purple-500/10" />

                    {/* Center glow */}

                    {isActive && (

                      <div className="absolute inset-0 shadow-[0_0_90px_rgba(168,85,247,0.45)]" />

                    )}

                  </div>

                </Link>

              </motion.div>

            )

          })}

        </motion.div>

        {/* INDICATORS */}

        <div className="flex justify-center mt-12 gap-3">

          {banners.map((_, i) => (

            <motion.button
              key={i}
              onClick={() => setPosition(loop ? i + 1 : i)}
              animate={{
                width: activeIndex === i ? 36 : 10,
                opacity: activeIndex === i ? 1 : 0.35,
              }}
              transition={{ duration: 0.3 }}
              className={`h-[10px] rounded-full ${
                activeIndex === i
                  ? 'bg-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.9)]'
                  : 'bg-white/30'
              }`}
            />

          ))}

        </div>

      </div>

    </section>

  )

}