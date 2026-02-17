'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { motion } from 'framer-motion'
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
      const list = json.data || []

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
    <div className="p-10 text-white">

      {/* HEADER */}
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold">Manajemen Voucher</h1>

        <button
          onClick={() => {
            setSelected(null)
            setOpenModal(true)
          }}
          className="btn-primary"
        >
          + Tambah Voucher
        </button>
      </motion.div>

      {/* TAB + SEARCH */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <VoucherTabs />

        <input
          className="input w-full md:w-72"
          placeholder="Cari kode voucher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* LIST */}
      <div className="space-y-5">
        {loading ? (
          <SkeletonList />
        ) : filtered.length > 0 ? (
          filtered.map(v => (
            <VoucherCard
              key={v.id}
              data={v}
              onEdit={() => {
                setSelected(v)
                setOpenModal(true)
              }}
              onDelete={() => handleDelete(v.id)}
              onToggle={() => handleToggle(v)}
            />
          ))
        ) : (
          <EmptyState text="Voucher tidak ditemukan" />
        )}
      </div>

      <VoucherModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={loadVouchers}
        selected={selected}
      />
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-20 text-gray-400 border border-purple-900/40 rounded-2xl">
      {text}
    </div>
  )
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl bg-gradient-to-r from-purple-900/20 via-purple-700/20 to-purple-900/20 animate-pulse"
        />
      ))}
    </>
  )
}
