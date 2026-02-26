'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from "../../app/hooks/useAuth"
import { cn } from "../lib/utils"
import Cookies from "js-cookie"

/* ================= UTIL ================= */
const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

/* ================= COMPONENT ================= */
export default function NavbarCustomer() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const token = Cookies.get("token")

  const [brand, setBrand] = useState({})
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const searchRef = useRef(null)

  const [search, setSearch] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [filteredSubs, setFilteredSubs] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  /* ✅ NEW STATE MOBILE MENU */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const avatarSrc = user?.avatar_url || user?.avatar || null

  /* ================= FETCH BRAND ================= */
  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => {
        const data = normalizeSettings(res?.data)
        setBrand(data.brand || {})
      })
      .catch(console.error)
  }, [API])

  /* ================= CLICK OUTSIDE SEARCH ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /* ================= FETCH SUBCATEGORIES ================= */
  useEffect(() => {
    fetchSubcategories()
  }, [])

  const fetchSubcategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/subcategories`)
      const json = await res.json()

      if (json.success) {
        setSubcategories(json.data)
      }
    } catch (err) {
      console.error("Failed fetch subcategories:", err)
    }
  }

  /* ================= SEARCH FILTER ================= */
  useEffect(() => {
    if (!search.trim()) {
      setFilteredSubs([])
      return
    }

    const keyword = search.toLowerCase()

    const filtered = subcategories.filter(sub =>
      sub.name.toLowerCase().includes(keyword)
    )

    setFilteredSubs(filtered)
  }, [search, subcategories])

  /* ================= SCROLL SHRINK ================= */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ================= FETCH CART ================= */
  useEffect(() => {
    if (!user) return
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      const token = Cookies.get("token")

      if (!token) {
        setCartCount(0)
        return
      }

      const res = await fetch(`${API}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        setCartCount(0)
        return
      }

      const json = await res.json()

      if (json.success) {
        const items = json?.data?.items || []
        setCartItems(items)
        const total = items.reduce((sum, item) => sum + (item.qty || 1), 0)
        setCartCount(total)
      }
    } catch (err) {
      console.error(err)
      setCartCount(0)
    }
  }

  if (loading) return null

  /* ================= NAV CONFIG ================= */
  const navItems = [
    { label: "Home", href: "/customer" },
    { label: "Product", href: "/customer/category" },
  ]

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const handleSelectSub = (subId) => {
    setSearch("")
    setSearchOpen(false)
    setMobileMenuOpen(false)
    router.push(`/customer/category/product?subcategory=${subId}`)
  }

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "bg-gradient-to-r from-[#14002a] to-[#2b044d]",
        "border-b border-purple-800/40",
        scrolled ? "py-2 shadow-xl" : "py-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <Image src="/logoherosection.png" alt="Growtech" fill priority />
          </div>
          <span className="text-white font-semibold text-sm sm:text-lg">
            {brand.site_name || "Growtech Central"}
          </span>
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden lg:flex items-center gap-8 relative">

          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-2 py-1 text-sm font-medium transition",
                isActive(item.href)
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* SEARCH DESKTOP */}
          <div ref={searchRef} className="relative ml-6 w-[320px]">
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full rounded-full bg-white py-2 pl-4 pr-4 text-sm"
            />

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute top-12 left-0 w-full rounded-xl bg-[#14002a] border border-purple-700/50 shadow-xl"
                >
                  {filteredSubs.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSub(sub.id)}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-700/30"
                    >
                      {sub.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-3 sm:gap-5">

          {/* ✅ MOBILE SEARCH BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white text-2xl"
          >
            ☰
          </button>

          {/* CART */}
          <Link href="/customer/category/product/detail/cart" className="relative text-white">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* USER */}
          <button onClick={() => setOpen(!open)}>
            <div className="relative h-9 w-9 rounded-full overflow-hidden bg-purple-600">
              {avatarSrc ? (
                <Image src={avatarSrc} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white">👤</div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#14002a] border-t border-purple-800/40 px-4 py-4 space-y-4"
          >
            {/* NAV ITEMS */}
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block text-sm",
                  isActive(item.href)
                    ? "text-purple-300"
                    : "text-white/80"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* SEARCH MOBILE */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSearchOpen(true)
                }}
                className="w-full rounded-full bg-white py-2 px-4 text-sm"
              />

              {search && filteredSubs.length > 0 && (
                <div className="mt-2 rounded-xl bg-[#1b0038] border border-purple-700/50">
                  {filteredSubs.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSub(sub.id)}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-700/30"
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}