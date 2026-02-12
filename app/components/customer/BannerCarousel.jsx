'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

export default function BannerCarousel() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const USE_UNOPTIMIZED = true

  // Motion values for 3D tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-100, 100], [6, -6])
  const rotateY = useTransform(mouseX, [-100, 100], [-6, 6])

  // ================= FETCH =================
  useEffect(() => {
    fetch(`${API}/api/v1/content/banners`)
      .then(res => res.json())
      .then(res => {
        const active = (res.data || [])
          .sort((a, b) => a.sort_order - b.sort_order)

        setBanners(active)
      })
      .catch(console.error)
  }, [API])

  // ================= AUTO SLIDE =================
  useEffect(() => {
    if (paused || banners.length <= 1) return

    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % banners.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [banners, paused])

  useEffect(() => {
    setIndex(0)
  }, [banners])

  if (!banners.length) return null

  const nextSlide = () =>
    setIndex(prev => (prev + 1) % banners.length)

  const prevSlide = () =>
    setIndex(prev => (prev - 1 + banners.length) % banners.length)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    mouseX.set(x / 5)
    mouseY.set(y / 5)
  }

  const resetTilt = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section className="mx-auto max-w-7xl px-8 mt-20">
      <motion.div
        className="relative rounded-2xl group perspective"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false)
          resetTilt()
        }}
        onMouseMove={handleMouseMove}
        style={{ perspective: 1200 }}
      >
        {/* GLOW BORDER */}
        <div className="absolute -inset-[1px] rounded-2xl glow-border opacity-70 group-hover:opacity-100 transition" />

        <motion.div
          style={{ rotateX, rotateY }}
          className="relative overflow-hidden rounded-2xl bg-black"
        >
          <div className="relative w-full h-[260px] md:h-[340px]">

            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.08, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.92, rotate: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -80) nextSlide()
                  if (info.offset.x > 80) prevSlide()
                }}
              >
                <Link href={banners[index].link_url || '#'}>
                  <Image
                    src={banners[index].image_url}
                    alt={banners[index].title || 'Banner'}
                    fill
                    priority
                    unoptimized={USE_UNOPTIMIZED}
                    className="object-cover"
                  />
                </Link>

                {/* GLASS GLOW OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-400/10" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* NAVIGATION */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevSlide}
            className="nav-btn left-4"
          >
            ‹
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            className="nav-btn right-4"
          >
            ›
          </motion.button>

          {/* INDICATORS */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setIndex(i)}
                whileHover={{ scale: 1.4 }}
                className={`indicator ${
                  i === index ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* STYLES */}
        <style jsx>{`
          .glow-border {
            background: linear-gradient(
              120deg,
              rgba(168, 85, 247, 0.7),
              rgba(34, 211, 238, 0.7),
              rgba(168, 85, 247, 0.7)
            );
            filter: blur(8px);
            z-index: -1;
          }

          .nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.35);
            backdrop-filter: blur(6px);
            padding: 8px 14px;
            border-radius: 10px;
            color: white;
            opacity: 0;
            transition: 0.3s;
          }

          .group:hover .nav-btn {
            opacity: 1;
          }

          .indicator {
            height: 10px;
            width: 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.35);
            transition: 0.3s;
          }

          .indicator.active {
            width: 26px;
            background: rgb(168, 85, 247);
            box-shadow: 0 0 12px rgba(168,85,247,0.8);
          }
        `}</style>
      </motion.div>
    </section>
  )
}
