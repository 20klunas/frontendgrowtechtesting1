'use client'
import Link from 'next/link'
import { useState } from 'react'
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal'
import { motion } from 'framer-motion'
export default function DiscountPage() {
  const discounts = [
    { id: 1, name: 'Diskon Natal', value: '2%', category: 'Cloud Phone', sub: 'Premium', active: true },
    { id: 2, name: 'Diskon VPN', value: 'Rp 5.000', category: 'VPN', sub: 'Premium', active: false },
  ]


  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)


  const openDeleteModal = (id) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setDeleteId(null)
  }

  const confirmDelete = () => {
    // Logic to delete discount
    closeDeleteModal()
  }

  return (
    <div className="p-10">
      {/* ================= HEADER ================= */}
      <motion.button className="btn-purple-solid flex justify-between items-center mb-10" whileHover={{ scale:1.05}} whileTap={{ scale:0.95 }} transition={{ type: 'spring', stiffness: 460, damping: 18 }}>
        <h1 className="text-4xl font-bold">Manajemen Discount</h1>
        <Link href="/admin/voucher/discount/add" className="btn-primary">
          + Tambah Discount
        </Link>
      </motion.button>

      {/* ================= TAB ================= */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/admin/voucher"
          className="px-6 py-2 rounded-lg border border-purple-600 hover:bg-purple-900/40 transition"
        >
          Voucher
        </Link>
        <button className="btn-primary">Discount</button>
      </div>

      {/* ================= TABLE HEADER ================= */}
      <div className="grid grid-cols-6 gap-4 px-6 py-3 mb-3 text-sm text-gray-400">
        <div>Nama Discount</div>
        <div>Nominal</div>
        <div>Kategori Produk</div>
        <div>Sub Kategori</div>
        <div>Status</div>
        <div className="text-right">Aksi</div>
      </div>

      {/* ================= LIST ================= */}
      {discounts.map(d => (
        <div
          key={d.id}
          className="border border-purple-700 rounded-2xl p-6 mb-5 bg-black/60 hover:bg-black/80 transition"
        >
          <div className="grid grid-cols-6 items-center gap-4">
            {/* Nama */}
            <div className="font-semibold">{d.name}</div>

            {/* Nominal */}
            <div className="font-medium">{d.value}</div>

            {/* Kategori */}
            <div>{d.category}</div>

            {/* Sub */}
            <div>{d.sub}</div>

            {/* Status */}
            <div>
              <span
                className={`badge ${
                  d.active ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {d.active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {/* Action */}
            <div className="flex justify-end gap-3">
              <Link
                href={`/admin/voucher/discount/edit/${d.id}`}
                className="bg-orange-500 hover:bg-orange-400 p-3 rounded-lg transition"
                title="Edit"
              >
                ✏
              </Link>
                <button
                onClick={() => setOpenDelete(true)}
                className="bg-red-600 p-3 rounded-lg"
                >
                🗑
                </button>
                <ConfirmDeleteModal
                    open={openDelete}
                    onClose={() => setOpenDelete(false)}
                    onConfirm={() => {
                        setOpenDelete(false)
                        console.log('delete confirmed')
                    }}
                />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
