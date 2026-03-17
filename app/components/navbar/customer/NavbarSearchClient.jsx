'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '../../../lib/authFetch'
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from '../../../lib/maintenanceHandler'

export default function NavbarSearchClient() {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInteracted, setSearchInteracted] = useState(false)

  const [subcategories, setSubcategories] = useState([])
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
  const [subcategoriesLoaded, setSubcategoriesLoaded] = useState(false)
  const [searchMaintenance, setSearchMaintenance] = useState('')

  const searchRef = useRef(null)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const ensureSubcategoriesLoaded = async () => {
    if (subcategoriesLoaded || subcategoriesLoading) return

    try {
      setSubcategoriesLoading(true)
      setSearchMaintenance('')

      const json = await authFetch('/api/v1/catalog/subcategories')

      if (json?.success) {
        setSubcategories(Array.isArray(json.data) ? json.data : [])
        setSubcategoriesLoaded(true)
      } else {
        setSubcategories([])
      }
    } catch (err) {
      if (isFeatureMaintenanceError(err, 'catalog_access')) {
        setSearchMaintenance(
          getMaintenanceMessage(err, 'Katalog sedang maintenance.')
        )
        setSubcategories([])
        return
      }

      if (!isMaintenanceError(err)) {
        console.error('Failed fetch subcategories:', err)
      }

      setSubcategories([])
    } finally {
      setSubcategoriesLoading(false)
    }
  }

  const filteredSubs = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase()

    if (!searchInteracted) return []
    if (!keyword) return []

    return subcategories.filter((sub) =>
      sub?.name?.toLowerCase()?.includes(keyword)
    )
  }, [deferredSearch, subcategories, searchInteracted])

  const handleSearchFocus = () => {
    setSearchInteracted(true)
    setSearchOpen(true)
    ensureSubcategoriesLoaded()
  }

  const handleSearchChange = (e) => {
    const value = e.target.value

    setSearch(value)
    setSearchInteracted(true)
    setSearchOpen(true)

    if (value.trim()) {
      ensureSubcategoriesLoaded()
    }
  }

  const handleSelectSub = (subId) => {
    if (searchMaintenance) {
      alert(searchMaintenance)
      return
    }

    setSearch('')
    setSearchOpen(false)

    router.replace(`/customer/category/product?subcategory=${subId}`)
  }

  const placeholder = subcategoriesLoading
    ? 'Memuat katalog...'
    : searchMaintenance || 'Cari produk...'

  return (
    <div ref={searchRef} className="group relative ml-6 hidden w-[320px] lg:block">
      <span
        className="
          pointer-events-none
          absolute left-4 top-1/2 -translate-y-1/2
          text-purple-400/80 transition
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

      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleSearchChange}
        onFocus={handleSearchFocus}
        className="
          w-full rounded-full
          border border-purple-300/40
          bg-white/95
          py-2.5 pl-11 pr-4
          text-sm text-zinc-900
          shadow-sm transition-all duration-300
          placeholder:text-zinc-400
          hover:shadow-md
          focus:border-purple-500
          focus:outline-none
          focus:ring-2 focus:ring-purple-500/30
        "
      />

      <div
        className="
          pointer-events-none
          absolute inset-0 rounded-full
          bg-gradient-to-r from-purple-500/10 to-indigo-500/10
          opacity-0 transition
          group-hover:opacity-100
        "
      />

      {searchOpen && (
        <div
          className="
            absolute left-0 top-12 z-50 w-full overflow-hidden rounded-xl
            border border-purple-700/50 bg-[#14002a] shadow-2xl
          "
        >
          {searchMaintenance ? (
            <div className="px-4 py-3 text-sm text-white/70">
              {searchMaintenance}
            </div>
          ) : subcategoriesLoading ? (
            <div className="px-4 py-3 text-sm text-white/60">
              Memuat subkategori...
            </div>
          ) : !searchInteracted || !search.trim() ? (
            <div className="px-4 py-3 text-xs text-white/40">
              Ketik nama produk ...
            </div>
          ) : filteredSubs.length > 0 ? (
            filteredSubs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSelectSub(sub.id)}
                className="
                  w-full px-4 py-2.5 text-left text-sm text-white/80 transition
                  hover:bg-purple-700/30 hover:text-white
                "
              >
                {sub.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-white/50">
              Tidak ada subkategori
            </div>
          )}
        </div>
      )}
    </div>
  )
}