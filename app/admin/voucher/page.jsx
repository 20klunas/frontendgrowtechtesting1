'use client'
import { useState } from 'react'
import VoucherCard from './components/VoucherCard'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function VoucherPage() {
  const data = [
    { id: 1, code: 'PROMO5K', discount: '5.000', min: '100.000', used: 45, limit: 100, active: true },
    { id: 2, code: 'PROMO15K', discount: '15.000', min: '50.000', used: 68, limit: 100, active: false },
  ]

  const [search, setSearch] = useState('')

  const filtered = data.filter(v =>
    v.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-10">
      {/* TITLE */}
      <motion.div
        className="flex justify-between items-center mb-8"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <h1 className="text-4xl font-bold">Manajemen Voucher</h1>

        <Link href="/admin/voucher/add" className="btn-primary">
          + Tambah Voucher
        </Link>
      </motion.div>


      {/* TAB */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-3 mb-6">
          <Link
            href="/admin/voucher"
            className="px-6 py-2 rounded-lg text-sm font-medium transition
              bg-purple-700 hover:bg-purple-600"
          >
            Voucher
          </Link>

          <Link
            href="/admin/voucher/discount"
            className="px-6 py-2 rounded-lg text-sm font-medium transition
              border border-purple-600 hover:bg-purple-900/40"
          >
            Discount
          </Link>
        </div>

        <input
          className="input w-72"
          placeholder="Cari kode voucher"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* LIST */}
      {filtered.map(v => (
        <VoucherCard key={v.id} data={v} />
      ))}
    </div>
  )
}
