'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from "../../app/hooks/useAuth"

const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

export default function NavbarCustomer() {
  const API = process.env.NEXT_PUBLIC_API_URL

  const { user, logout, loading } = useAuth()

  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState({})
  const avatarSrc = user?.avatar_url || user?.avatar || null

  // HOOK HARUS SELALU DIPANGGIL
  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => {
        const data = normalizeSettings(res?.data)
        setBrand(data.brand || {})
      })
      .catch(console.error)
  }, [API])

  // EARLY RETURN SETELAH SEMUA HOOK
  if (loading) return null

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#14002a] to-[#2b044d] border-b border-purple-800/40">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <Image
              src="/logoherosection.png"
              alt="Growtech"
              fill
              priority
            />
          </div>
          <span className="brand-text">
            {brand.site_name || "Growtech Central"}
          </span>
        </div>

        {/* CENTER */}
        <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
          <Link href="/customer" className="text-white/80 hover:text-white">
            Home
          </Link>
          <Link href="/customer/category" className="text-white/80 hover:text-white">
            Product
          </Link>

          <div className="relative ml-6 w-[320px]">
            <input
              type="text"
              placeholder="Cari produk..."
              className="w-full rounded-full bg-white py-2 pl-10 pr-4 text-sm text-black focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex items-center gap-5">

          <Link href="/customer/category/product/detail/cart" className="relative text-white">
            🛒
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
              1
            </span>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2"
          >
            <div className="text-right leading-tight">
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
                  key={avatarSrc}
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

          {open && (
            <div className="absolute right-0 top-14 w-48 rounded-xl border border-purple-700/60 bg-[#14002a] shadow-xl overflow-hidden">
              {[
                ['👤', 'Profile', '/customer/profile'],
                ['🎯', 'Referral', '/customer/referral'],
                ['💰', 'Top Up', '/customer/topup'],
              ].map(([icon, label, href]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-purple-700/30"
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
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
