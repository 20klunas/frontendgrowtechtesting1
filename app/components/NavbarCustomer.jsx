'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from "../../app/hooks/useAuth"
import { cn } from "../lib/utils"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation";
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
  const { user, logout, loading } = useAuth()
  const token = Cookies.get("token")
  const [brand, setBrand] = useState({})
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

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

  /* ================= FETCH SUBCATEGORIES ================= */
  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/subcategories`);
      const json = await res.json();

      if (json.success) {
        setSubcategories(json.data);
      }
    } catch (err) {
      console.error("Failed fetch subcategories:", err);
    }
  };

  /* ================= SEARCH FILTER ================= */
  useEffect(() => {
    if (!search.trim()) {
      setFilteredSubs([]);
      return;
    }

    const keyword = search.toLowerCase();

    const filtered = subcategories.filter(sub =>
      sub.name.toLowerCase().includes(keyword)
    );

    setFilteredSubs(filtered);
  }, [search, subcategories]);

  /* ================= SCROLL SHRINK ================= */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ================= FETCH CART COUNT ================= */
  useEffect(() => {
    if (!user) return

    fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      const token = Cookies.get("token")

      if (!token) {
        console.warn("No token found")
        setCartCount(0)
        return
      }

      const res = await fetch(`${API}/api/v1/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        console.error("Cart error:", res.status, text)
        setCartCount(0)
        return
      }

      const contentType = res.headers.get("content-type")

      if (!contentType?.includes("application/json")) {
        const text = await res.text()
        console.error("Non JSON response:", text)
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
    { label: "Product", href: "/customer/category" },
  ]

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`)

  /* ================= HANDLERS ================= */
  const handleSelectSub = (subId) => {
    setSearch("");
    setSearchOpen(false);

    router.push(`/customer/category/product?subcategory=${subId}`);
  };

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
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between gap-6">

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
          <span className="text-white font-semibold text-lg">
            {brand.site_name || "Growtech Central"}
          </span>
        </div>

        {/* ================= CENTER (DESKTOP) ================= */}
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
          <div className="relative ml-6 w-[320px] group">

            {/* ICON */}
            <span
              className="
                pointer-events-none
                absolute left-4 top-1/2 -translate-y-1/2
                transition
                text-purple-400/80
                group-focus-within:text-purple-500
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                <path d="M21 38c9.389 0 17-7.611 17-17S30.389 4 21 4S4 11.611 4 21s7.611 17 17 17Z" />
                <path
                  strokeLinecap="round"
                  d="M26.657 14.343A7.98 7.98 0 0 0 21 12a7.98 7.98 0 0 0-5.657 2.343m17.879 18.879l8.485 8.485"
                />
              </svg>
            </span>

            {/* INPUT */}
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="
                w-full rounded-full
                bg-white/95
                py-2.5 pl-11 pr-4
                text-sm text-zinc-900
                placeholder:text-zinc-400

                border border-purple-300/40
                focus:border-purple-500
                focus:ring-2 focus:ring-purple-500/30
                focus:outline-none

                shadow-sm
                transition-all duration-300
                hover:shadow-md
              "
            />

            {/* GLOW */}
            <div
              className="
                pointer-events-none
                absolute inset-0 rounded-full
                opacity-0 group-hover:opacity-100
                transition
                bg-gradient-to-r from-purple-500/10 to-indigo-500/10
              "
            />

            {/* DROPDOWN RESULT */}
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

                {/* EMPTY STATE */}
                {search && filteredSubs.length === 0 && (
                  <div className="px-4 py-3 text-sm text-white/50">
                    Tidak ada subkategori
                  </div>
                )}

                {/* HINT STATE */}
                {!search && (
                  <div className="px-4 py-3 text-xs text-white/40">
                    Ketik nama produk ...
                  </div>
                )}

              </motion.div>
            )}
          </div>

        </div>

        {/* MOBILE MENU */}
        <div className="lg:hidden flex items-center gap-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium",
                isActive(item.href)
                  ? "text-purple-300"
                  : "text-white/80"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ================= RIGHT ================= */}
        <div className="relative flex items-center gap-5" onMouseEnter={() => setCartOpen(true)} onMouseLeave={() => setCartOpen(false)}>

          {/* CART */}
          <Link
            href="/customer/category/product/detail/cart"
            className="relative text-white transition"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          {cartOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="
                absolute right-0 top-10 w-80
                rounded-xl border border-purple-700/50
                bg-[#14002a] shadow-2xl
                p-4 z-50
              "
            >
              <h3 className="text-sm font-semibold text-white mb-3">
                Keranjang
              </h3>

              {cartItems.length === 0 ? (
                <p className="text-sm text-white/60">
                  Cart kosong
                </p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-3 items-center"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-purple-900/30">
                        <Image
                          src={item.product?.thumbnail || "/no-image.png"}
                          alt={item.product?.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-white line-clamp-1">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-purple-300">
                          Qty: {item.qty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/customer/category/product/detail/cart"
                className="
                  mt-4 block text-center text-sm font-medium
                  bg-purple-600 hover:bg-purple-500
                  text-white py-2 rounded-lg transition
                "
              >
                Lihat Keranjang
              </Link>
            </motion.div>
          )}



          {/* USER BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2"
          >
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-white">
                {user?.name}
              </div>
              <div className="text-xs text-purple-300">
                {user?.role}
              </div>
            </div>

            <div className="relative h-9 w-9 rounded-full overflow-hidden bg-purple-600">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="Avatar"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white text-sm">
                  👤
                </div>
              )}
            </div>
          </button>

          {/* ================= DROPDOWN ================= */}
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
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition",
                    isActive(href)
                      ? "bg-purple-700/40 text-white"
                      : "text-white/80 hover:bg-purple-700/30"
                  )}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              ))}

              <button
                onClick={logout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
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
