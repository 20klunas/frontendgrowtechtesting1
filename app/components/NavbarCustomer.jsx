'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Cookies from "js-cookie"
import { Heart } from "lucide-react"

import { useAuth } from "../../app/hooks/useAuth"
import { cn } from "../lib/utils"
import { authFetch } from "../lib/authFetch"

import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../lib/maintenanceHandler"

import useCatalogAccess from "../../app/hooks/useCatalogAccess"


export default function NavbarCustomer({ brand = {} }) {

  const API = process.env.NEXT_PUBLIC_API_URL

  const pathname = usePathname()
  const router = useRouter()

  const { user, logout, loading } = useAuth()

  const searchRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  const [catalogMaintenance, setCatalogMaintenance] = useState("")

  const { catalogDisabled, catalogMessage } = useCatalogAccess()

  const avatarSrc = user?.avatar_url || user?.avatar || null


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

      setCatalogMaintenance("")

      const json = await authFetch("/api/v1/catalog/subcategories")

      if (json.success) {
        setSubcategories(json.data)
      }

    } catch (err) {

      if (isFeatureMaintenanceError(err, "catalog_access")) {

        setCatalogMaintenance(
          getMaintenanceMessage(err, "Katalog sedang maintenance.")
        )

        setSubcategories([])

        return

      }

      if (!isMaintenanceError(err)) {
        console.error("Failed fetch subcategories:", err)
      }

    }

  }


  /* ================= SEARCH FILTER ================= */

  const filteredSubs = useMemo(() => {

    if (!search.trim()) return []

    const keyword = search.toLowerCase()

    return subcategories.filter(sub =>
      sub.name.toLowerCase().includes(keyword)
    )

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

        headers: {
          Authorization: `Bearer ${token}`
        }

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

      console.error("Failed fetch cart:", err)

      setCartCount(0)

    }

  }


  if (loading) return null


  /* ================= NAV CONFIG ================= */

  const navItems = [

    { label: "Home", href: "/customer" },
    { label: "Product", href: "/customer/category" }

  ]


  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`)


  /* ================= HANDLERS ================= */

  const handleSelectSub = (subId) => {

    if (catalogDisabled) {

      alert(catalogMessage)

      return

    }

    setSearch("")
    setSearchOpen(false)

    router.replace(`/customer/category/product?subcategory=${subId}`)

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

      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between gap-6">


        {/* ================= LEFT ================= */}

        <div className="flex items-center gap-3">

          <div className="relative w-9 h-9">

            <Image
              src="/logoherosection.png"
              alt="Growtech"
              fill
              priority
            />

          </div>

          <span className="hidden sm:block text-white font-semibold text-lg">
            {brand.site_name || "Growtech Central"}
          </span>

        </div>


        {/* ================= CENTER ================= */}

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

              {isActive(item.href) && (

                <motion.span
                  layoutId="customer-nav-underline"
                  className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-purple-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />

              )}

            </Link>

          ))}


          {/* ================= SEARCH ================= */}

          <div ref={searchRef} className="relative ml-6 w-[320px] group">

            <input
              disabled={catalogDisabled}
              type="text"
              placeholder={
                catalogDisabled
                  ? "Katalog sedang maintenance"
                  : "Cari produk..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              className="
                w-full rounded-full
                bg-white/95
                py-2.5 pl-4 pr-4
                text-sm text-zinc-900
                placeholder:text-zinc-400
                border border-purple-300/40
                focus:border-purple-500
                focus:ring-2 focus:ring-purple-500/30
                outline-none
              "
            />


            {searchOpen && (

              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="
                  absolute top-12 left-0 w-full
                  rounded-xl
                  bg-[#14002a]
                  border border-purple-700/50
                  shadow-2xl
                  overflow-hidden
                  z-50
                "
              >

                {search && filteredSubs.length > 0 && (

                  filteredSubs.map(sub => (

                    <button
                      key={sub.id}
                      onClick={() => handleSelectSub(sub.id)}
                      className="
                        w-full text-left px-4 py-2.5
                        text-sm text-white/80
                        hover:bg-purple-700/30
                        hover:text-white
                        transition
                      "
                    >

                      {sub.name}

                    </button>

                  ))

                )}


                {search && filteredSubs.length === 0 && (

                  <div className="px-4 py-3 text-sm text-white/50">
                    Tidak ada subkategori
                  </div>

                )}


                {!search && (

                  <div className="px-4 py-3 text-xs text-white/40">
                    Ketik nama produk ...
                  </div>

                )}

              </motion.div>

            )}

          </div>

        </div>


        {/* ================= RIGHT ================= */}

        <div className="relative flex items-center gap-3">


          <Link
            href="/customer/favorites"
            className="text-white hover:text-pink-400 transition"
          >
            <Heart size={20}/>
          </Link>


          <Link
            href="/customer/category/product/detail/cart"
            className="relative text-white"
            onMouseEnter={() => setCartOpen(true)}
            onMouseLeave={() => setCartOpen(false)}
          >

            🛒

            {cartCount > 0 && (

              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold">

                {cartCount}

              </span>

            )}

          </Link>


          {/* ================= USER ================= */}

          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2"
          >

            <div className="text-right hidden md:block">

              <div className="text-sm font-semibold text-white">
                {user?.name}
              </div>

              <div className="text-xs text-purple-300">
                {user?.tier}
              </div>

            </div>


            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-purple-600">

              {avatarSrc ? (

                <Image
                  src={avatarSrc}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />

              ) : (

                <div className="h-full w-full flex items-center justify-center text-white text-sm">
                  👤
                </div>

              )}

            </div>

          </button>


          {open && (

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                absolute right-0 top-14 w-48
                rounded-xl border border-purple-700/60
                bg-[#14002a] shadow-xl overflow-hidden
              "
            >

              {[
                ['👤', 'Profile', '/customer/profile'],
                ['🎯', 'Referral', '/customer/referral'],
                ['💰', 'Top Up', '/customer/topup'],
              ].map(([icon, label, href]) => (

                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="
                    flex items-center gap-3 px-4 py-3 text-sm
                    text-white/80 hover:bg-purple-700/30
                  "
                >

                  <span>{icon}</span>
                  {label}

                </Link>

              ))}


              <button
                onClick={logout}
                className="
                  flex w-full items-center gap-3 px-4 py-3 text-sm
                  text-red-400 hover:bg-red-500/10
                "
              >
                ⎋ Log Out
              </button>

            </motion.div>

          )}

        </div>

      </div>

    </motion.nav>

  )

}