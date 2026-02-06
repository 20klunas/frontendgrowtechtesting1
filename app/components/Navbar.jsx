'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import Script from "next/script"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../app/hooks/useAuth"
import { cn } from "../lib/utils"

/* ================= UTIL ================= */
const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

/* ================= BREADCRUMB ================= */
function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (!segments.length) return null

  return (
    <div className="mx-auto max-w-7xl px-6 py-2 text-xs text-zinc-500 dark:text-zinc-400">
      <div className="flex items-center gap-2">
        <Link href="/" className="hover:text-purple-500">Home</Link>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/")
          return (
            <span key={href} className="flex items-center gap-2">
              <span>/</span>
              <Link href={href} className="capitalize hover:text-purple-500">
                {seg.replace(/-/g, " ")}
              </Link>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ================= NAVBAR ================= */
export default function Navbar() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [brand, setBrand] = useState({})
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState(pathname)

  /* fetch brand */
  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => setBrand(normalizeSettings(res?.data)?.brand || {}))
      .catch(console.error)
  }, [API])

  /* navbar shrink + scroll spy */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setActive(pathname)
  }, [pathname])

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/product" },
  ]

  const isActive = (href) =>
    active === href || active.startsWith(`${href}/`)

  /* ================= SEO BREADCRUMB SCHEMA ================= */
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: pathname
      .split("/")
      .filter(Boolean)
      .map((seg, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: seg.replace(/-/g, " "),
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/${pathname
          .split("/")
          .slice(1, i + 2)
          .join("/")}`,
      })),
  }

  return (
    <>
      {/* SEO Breadcrumb */}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "sticky top-0 z-50 transition-all",
          "bg-gradient-to-r from-[#14002a] to-[#2b044d] border-b border-purple-800/40",
          scrolled ? "py-2 shadow-lg" : "py-4"
        )}
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <Image src="/logoherosection.png" alt="Growtech" width={36} height={36} />
            <span className="font-semibold text-white text-lg">
              {brand.site_name || "Growtech Central"}
            </span>
          </div>

          {/* RIGHT MENU (HOME – PRODUCT – LOGIN BERDEKATAN) */}
          <div className="flex items-center gap-6 relative">

            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium transition",
                  isActive(item.href)
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-2 left-0 right-0 h-[2px] bg-purple-500 rounded-full"
                  />
                )}
              </Link>
            ))}

            {!user ? (
              <Link
                href="/login"
                className="text-sm font-medium text-purple-300 hover:text-purple-200"
              >
                Login
              </Link>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/customer")}
                className="text-sm text-white/80 hover:text-white"
              >
                Dashboard
              </motion.button>
            )}
          </div>
        </div>

        {/* MOBILE INDICATOR */}
        {/* <div className="md:hidden flex justify-center gap-8 pt-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs font-medium",
                isActive(item.href)
                  ? "text-purple-400"
                  : "text-white/50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div> */}
      </motion.nav>

      {/* BREADCRUMB UI */}
      <Breadcrumb />

      {/* PAGE TRANSITION */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        />
      </AnimatePresence>
    </>
  )
}
