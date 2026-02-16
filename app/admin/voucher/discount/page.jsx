'use client'
import Link from 'next/link'
import { useState } from 'react'
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal'
import { motion } from 'framer-motion'
import VoucherTabs from '../components/VoucherTabs'

export default function DiscountPage() {
  const discounts = [
    { id: 1, name: 'Diskon Natal', value: '2%', category: 'Cloud Phone', sub: 'Premium', active: true },
    { id: 2, name: 'Diskon VPN', value: 'Rp 5.000', category: 'VPN', sub: 'Premium', active: false },
  ]

  const [openDelete, setOpenDelete] = useState(false)

  return (
    <div className="p-10 text-white">

      {/* ================= HEADER ================= */}
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold">Manajemen Discount</h1>

        <Link href="/admin/voucher/discount/add" className="btn-primary">
          + Tambah Discount
        </Link>
      </motion.div>

      {/* ================= TAB ================= */}
      <div className="mb-6">
        <VoucherTabs />
      </div>

      {/* ================= TABLE ================= */}
      <div className="rounded-2xl border border-purple-900/40 overflow-hidden">
        
        {/* Header */}
        <div className="grid grid-cols-6 bg-purple-900/20 px-6 py-3 text-sm text-gray-300 font-medium">
          <div>Nama Discount</div>
          <div>Nominal</div>
          <div>Kategori</div>
          <div>Sub</div>
          <div>Status</div>
          <div className="text-right">Aksi</div>
        </div>

        {/* Rows */}
        {discounts.map(d => (
          <div
            key={d.id}
            className="grid grid-cols-6 items-center px-6 py-4 border-t border-purple-900/30 hover:bg-purple-900/10 transition"
          >
            <div className="font-medium">{d.name}</div>
            <div>{d.value}</div>
            <div>{d.category}</div>
            <div>{d.sub}</div>

            <div>
              <StatusBadge active={d.active} />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href={`/admin/voucher/discount/edit/${d.id}`}
                className="action-btn bg-orange-500 hover:bg-orange-400"
              >
                ✏
              </Link>

              <button
                onClick={() => setOpenDelete(true)}
                className="action-btn bg-red-600 hover:bg-red-500"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => {
          setOpenDelete(false)
          console.log('delete confirmed')
        }}
      />
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border
        ${active
          ? 'bg-green-600/20 text-green-400 border-green-600/40'
          : 'bg-red-600/20 text-red-400 border-red-600/40'
        }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}
