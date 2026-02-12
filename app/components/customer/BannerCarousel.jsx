'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function BannerCarousel() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const USE_UNOPTIMIZED = true

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

  return (
    <section className="mx-auto max-w-7xl px-8 mt-20">
      <div
        className="relative overflow-hidden rounded-2xl group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative w-full h-[260px] md:h-[340px]">

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* NAVIGATION ARROWS */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur px-3 py-2 rounded-lg text-white"
        >
          ‹
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur px-3 py-2 rounded-lg text-white"
        >
          ›
        </motion.button>

        {/* INDICATORS */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
          {banners.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIndex(i)}
              whileHover={{ scale: 1.3 }}
              className={`h-2.5 rounded-full transition-all ${
                i === index
                  ? 'w-6 bg-purple-400'
                  : 'w-2.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
