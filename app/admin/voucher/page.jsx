'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { motion, AnimatePresence } from 'framer-motion'
import VoucherTabs from './components/VoucherTabs'
import VoucherCard from './components/VoucherCard'
import VoucherModal from './components/VoucherModal'

const API = process.env.NEXT_PUBLIC_API_URL

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [openModal, setOpenModal] = useState(false)

  const loadVouchers = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API}/api/v1/admin/vouchers`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
      })

      const json = await res.json()

      const list =
        Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.data)
            ? json.data.data
            : []

      setVouchers(list)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVouchers()
  }, [])

  const filtered = useMemo(() => {
    if (!Array.isArray(vouchers)) return []

    return vouchers.filter(v =>
      v.code?.toLowerCase().includes(search.toLowerCase())
    )
  }, [vouchers, search])

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus voucher ini?')) return

    await fetch(`${API}/api/v1/admin/vouchers/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    })

    loadVouchers()
  }

  const handleToggle = async (voucher) => {
    await fetch(`${API}/api/v1/admin/vouchers/${voucher.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({ is_active: !voucher.is_active }),
    })

    loadVouchers()
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ================= CONTAINER ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ================= HEADER ================= */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Manajemen Voucher
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Kelola semua voucher dan diskon.
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null)
              setOpenModal(true)
            }}
            className="
              w-full md:w-auto
              px-5 py-2.5
              rounded-xl
              bg-gradient-to-r from-purple-600 to-purple-500
              hover:from-purple-500 hover:to-purple-400
              shadow-[0_0_20px_rgba(168,85,247,0.4)]
              transition-all duration-300
              font-medium
            "
          >
            + Tambah Voucher
          </button>
        </motion.div>

        {/* ================= FILTER SECTION ================= */}
        <div className="bg-gradient-to-b from-purple-950/30 to-black border border-purple-600/30 rounded-2xl p-4 sm:p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            {/* Tabs scrollable mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <VoucherTabs />
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <input
                className="
                  w-full
                  h-11
                  rounded-xl
                  bg-purple-900/30
                  border border-purple-600/30
                  px-4
                  text-sm
                  placeholder-gray-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-purple-500
                  transition
                "
                placeholder="Cari kode voucher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* ================= LIST ================= */}
        <div className="space-y-4 sm:space-y-5">

          {loading ? (
            <SkeletonList />
          ) : filtered.length > 0 ? (
            <AnimatePresence>
              {filtered.map(v => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <VoucherCard
                    data={v}
                    onEdit={() => {
                      setSelected(v)
                      setOpenModal(true)
                    }}
                    onDelete={() => handleDelete(v.id)}
                    onToggle={() => handleToggle(v)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <EmptyState text="Voucher tidak ditemukan" />
          )}

        </div>

      </div>

      {/* ================= MODAL ================= */}
      <VoucherModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={loadVouchers}
        selected={selected}
      />

    </div>
  )
}

/* ================= EMPTY STATE ================= */
function EmptyState({ text }) {
  return (
    <div className="
      text-center
      py-16
      text-gray-400
      border border-purple-900/40
      rounded-2xl
      bg-purple-950/10
    ">
      {text}
    </div>
  )
}

/* ================= SKELETON ================= */
function SkeletonList() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="
            h-28
            rounded-2xl
            bg-gradient-to-r
            from-purple-900/20
            via-purple-700/20
            to-purple-900/20
            animate-pulse
          "
        />
      ))}
    </>
  )
}