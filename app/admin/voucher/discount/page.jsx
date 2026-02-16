'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal'
import VoucherTabs from '../components/VoucherTabs'
import { motion } from 'framer-motion'

export default function DiscountPage() {
  const API = process.env.NEXT_PUBLIC_API_URL

  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)

  const loadDiscounts = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API}/api/v1/admin/discount-campaigns`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
      })

      const json = await res.json()

      const list = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.data)
        ? json.data.data
        : []

      setDiscounts(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiscounts()
  }, [])

  const handleDelete = async () => {
    await fetch(`${API}/api/v1/admin/discount-campaigns/${selectedId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })

    setOpenDelete(false)
    loadDiscounts()
  }

  const toggleEnabled = async (d) => {
    await fetch(`${API}/api/v1/admin/discount-campaigns/${d.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({ enabled: !d.enabled }),
    })

    loadDiscounts()
  }

  return (
    <div className="p-10 text-white">
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

      <div className="mb-6">
        <VoucherTabs />
      </div>

      <div className="rounded-2xl border border-purple-900/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-purple-900/20 text-gray-300">
            <tr>
              <th className="p-3">Nama</th>
              <th>Nominal</th>
              <th>Tipe</th>
              <th>Value</th>
              <th>Kategori</th>
              <th>Sub</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Priority</th>
              <th>Stack</th>
              <th>Status</th>
              <th>Enabled</th>
              <th className="text-right pr-4">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="13" className="p-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && discounts.map(d => (
              <tr
                key={d.id}
                className="border-t border-purple-900/30 hover:bg-purple-900/10"
              >
                <td className="p-3 font-medium">{d.nama_discount}</td>
                <td>{d.nominal}</td>
                <td>{d.discount_type}</td>
                <td>{d.discount_value}</td>
                <td>{d.kategori_produk || '-'}</td>
                <td>{d.sub_kategori || '-'}</td>
                <td>{formatDate(d.starts_at)}</td>
                <td>{formatDate(d.ends_at)}</td>
                <td>{d.priority}</td>
                <td>{d.stack_policy}</td>
                <td>{d.status}</td>

                <td>
                  <button onClick={() => toggleEnabled(d)}>
                    <Badge active={d.enabled} />
                  </button>
                </td>

                <td>
                  <Badge active={d.enabled} />
                </td>

                <td className="flex justify-end gap-2 p-3">
                  <Link
                    href={`/admin/voucher/discount/edit/${d.id}`}
                    className="action-btn bg-orange-500"
                  >
                    ✏
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedId(d.id)
                      setOpenDelete(true)
                    }}
                    className="action-btn bg-red-600"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function Badge({ active }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs border
      ${active
        ? 'bg-green-600/20 text-green-400 border-green-600/40'
        : 'bg-red-600/20 text-red-400 border-red-600/40'
      }`}>
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID')
}
