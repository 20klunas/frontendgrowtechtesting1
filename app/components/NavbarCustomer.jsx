'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
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

  const [brand, setBrand] = useState({})
  const [open, setOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [filteredSubs, setFilteredSubs] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  const searchRef = useRef(null)

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

  /* ================= SCROLL EFFECT ================= */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ================= CLICK OUTSIDE SEARCH ================= */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  /* ================= FETCH SUBCATEGORIES ================= */
  useEffect(() => {
    fetchSubcategories()
  }, [])

  const fetchSubcategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/subcategories`)
      const json = await res.json()
      if (json.success) setSubcategories(json.data)
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

  /* ================= FETCH CART ================= */
  useEffect(() => {
    if (!user) return
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      const token = Cookies.get("token")
      if (!token) return

      const res = await fetch(`${API}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) return

      const json = await res.json()
      if (json.success) {
        const items = json?.data?.items || []
        setCartItems(items)
        const total = items.reduce((sum, i) => sum + (i.qty || 1), 0)
        setCartCount(total)
      }
    } catch (err) {
      console.error("Cart error:", err)
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
        scrolled ? "py-2 shadow-xl" : "py-3"
      )}
    >
      <div className="
        mx-auto max-w-7xl
        px-4 sm:px-6
        flex items-center justify-between gap-3
      ">

        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image src="/logoherosection.png" alt="Growtech" fill />
          </div>
          <span className="text-white font-semibold text-sm sm:text-lg">
            {brand.site_name || "Growtech Central"}
          </span>
        </div>

        {/* ================= DESKTOP NAV ================= */}
        <div className="hidden lg:flex items-center gap-6">

          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition",
                isActive(item.href)
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* SEARCH */}
          <div ref={searchRef} className="relative w-[260px]">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Cari produk..."
              className="
                w-full rounded-full
                bg-white text-black
                px-4 py-2 text-sm
                outline-none
              "
            />

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="
                    absolute top-11 w-full
                    bg-[#14002a]
                    border border-purple-700/50
                    rounded-xl shadow-xl
                    overflow-hidden
                  "
                >
                  {filteredSubs.length > 0 ? (
                    filteredSubs.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSub(sub.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-purple-700/30"
                      >
                        {sub.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-white/50">
                      Tidak ditemukan
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-3">

          {/* CART */}
          <Link href="/customer/category/product/detail/cart">
            🛒
          </Link>

          {/* USER */}
          <button onClick={() => setOpen(!open)}>
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-purple-600">
              {avatarSrc ? (
                <Image src={avatarSrc} alt="Avatar" fill />
              ) : "👤"}
            </div>
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="lg:hidden text-white"
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden px-4 pb-4"
          >
            <div className="flex flex-col gap-2">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}

              <input
                placeholder="Cari..."
                className="rounded-lg px-3 py-2 text-sm text-black"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}