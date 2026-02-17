'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal'
import VoucherTabs from '../components/VoucherTabs'
import { motion } from 'framer-motion'

const PAGE_SIZE = 5

export default function DiscountPage() {
  const API = process.env.NEXT_PUBLIC_API_URL

  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('priority')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const loadDiscounts = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API}/api/v1/admin/discount-campaigns`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
      })

      const json = await res.json()
      const list = json.data?.data || json.data || []

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

  const handleDelete = async () => {
    await fetch(`${API}/api/v1/admin/discount-campaigns/${selectedId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })

    setOpenDelete(false)
    loadDiscounts()
  }

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return discounts.filter(d =>
      d.nama_discount?.toLowerCase().includes(search.toLowerCase())
    )
  }, [discounts, search])

  // ================= SORT =================
  const sorted = useMemo(() => {
    const copy = [...filtered]

    copy.sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]

      if (valA == null) return 1
      if (valB == null) return -1

      if (typeof valA === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA
      }

      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })

    return copy
  }, [filtered, sortKey, sortDir])

  // ================= PAGINATION =================
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="p-10 text-white">
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">
          Manajemen Discount
        </h1>

        <Link href="/admin/voucher/discount/add" className="btn-primary">
          + Tambah Discount
        </Link>
      </motion.div>

      <VoucherTabs />

      {/* SEARCH */}
      <div className="mt-6 mb-3">
        <input
          type="text"
          placeholder="Cari discount..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full md:w-80 px-4 py-2 rounded-lg bg-black border border-purple-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-purple-900/40 overflow-auto bg-gradient-to-b from-black to-purple-950/20 max-h-[520px]">
        <table className="w-full text-sm">
          <thead className="bg-purple-900/40 text-gray-300 sticky top-0 z-10 backdrop-blur">
            <tr className="text-xs uppercase tracking-wider">
              <SortableTh label="Nama" onClick={() => handleSort('nama_discount')} />
              <SortableTh label="Nominal" align="right" onClick={() => handleSort('nominal')} />
              <SortableTh label="Type" align="center" onClick={() => handleSort('discount_type')} />
              <SortableTh label="Value" align="center" onClick={() => handleSort('discount_value')} />
              <th className="text-center p-3">Min Order</th>
              <th className="text-center p-3">Max Discount</th>
              <th className="text-center p-3">Starts</th>
              <th className="text-center p-3">Ends</th>
              <SortableTh label="Priority" align="center" onClick={() => handleSort('priority')} />
              <SortableTh label="Stack" align="center" onClick={() => handleSort('stack_policy')} />
              <th className="text-center p-3">Usage</th>
              <th className="text-center p-3">Per User</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Targets</th>
              <th className="text-center p-3 pr-6">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="15" className="p-8 text-center text-gray-500">
                  Tidak ada discount
                </td>
              </tr>
            ) : (
              paginated.map((d, i) => (
                <tr
                  key={d.id}
                  className={`
                    border-t border-purple-900/30
                    ${i % 2 === 0 ? 'bg-black/40' : 'bg-purple-950/10'}
                    hover:bg-purple-900/20 transition
                  `}
                >
                  <td className="p-4 font-medium whitespace-nowrap text-center">
                    {d.nama_discount}
                  </td>

                  <td className="text-center font-mono">
                    {d.nominal}
                  </td>

                  <td className="text-center">
                    <TypeBadge type={d.discount_type} />
                  </td>

                  <td className="text-center font-mono">
                    {d.discount_value}
                  </td>

                  <td className="text-center">
                    {d.min_order_amount ?? '-'}
                  </td>

                  <td className="text-center">
                    {d.max_discount_amount ?? '-'}
                  </td>

                  <td className="text-center text-xs text-gray-400">
                    {formatDate(d.starts_at)}
                  </td>

                  <td className="text-center text-xs text-gray-400">
                    {formatDate(d.ends_at)}
                  </td>

                  <td className="text-center">{d.priority}</td>

                  <td className="text-center">
                    <StackBadge policy={d.stack_policy} />
                  </td>

                  <td className="text-center">
                    {d.usage_limit_total ?? '-'}
                  </td>

                  <td className="text-center">
                    {d.usage_limit_per_user ?? '-'}
                  </td>

                  {/* STATUS = ENABLED */}
                  <td className="text-center">
                    <button
                      onClick={() => toggleEnabled(d)}
                      className="hover:scale-105 transition"
                    >
                      <ToggleSwitch enabled={d.enabled} />
                    </button>
                  </td>

                  <td className="text-center">
                    <div className="flex flex-wrap gap-1">
                      {d.targets?.length ? (
                        d.targets.map(t => (
                          <span
                            key={`${t.type}-${t.id}`}
                            className="px-2 py-1 rounded-md text-xs bg-purple-900/30 border border-purple-700/40"
                          >
                            {t.type} #{t.id}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </div>
                  </td>

                  <td className="flex justify-end gap-2 p-4">
                    <Link
                      href={`/admin/voucher/discount/edit/${d.id}`}
                      className="action-btn bg-orange-500 hover:bg-orange-400"
                    >
                      ✏
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedId(d.id)
                        setOpenDelete(true)
                      }}
                      className="action-btn bg-red-600 hover:bg-red-500"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-purple-900/40"
          >
            Prev
          </button>

          <span className="px-3 py-1 text-sm">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded bg-purple-900/40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDeleteModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

// ================= COMPONENTS =================

function SortableTh({ label, align = 'left', onClick }) {
  return (
    <th
      onClick={onClick}
      className={`p-3 cursor-pointer select-none text-${align} hover:text-white`}
    >
      {label}
    </th>
  )
}

function ToggleSwitch({ enabled }) {
  return (
    <div
      className={`w-12 h-6 flex items-center rounded-full p-1 transition
        ${enabled ? 'bg-green-600' : 'bg-red-600'}`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow transform transition
          ${enabled ? 'translate-x-6' : ''}`}
      />
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-purple-900/20">
          <td colSpan="15" className="p-4">
            <div className="h-6 bg-gradient-to-r from-purple-900/20 via-purple-700/20 to-purple-900/20 animate-pulse rounded" />
          </td>
        </tr>
      ))}
    </>
  )
}

function TypeBadge({ type }) {
  const map = {
    fixed: 'bg-blue-600/20 text-blue-400 border-blue-600/40',
    percent: 'bg-purple-600/20 text-purple-400 border-purple-600/40',
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs border ${map[type]}`}>
      {type}
    </span>
  )
}

function StackBadge({ policy }) {
  const exclusive = policy === 'exclusive'

  return (
    <span
      className={`px-2 py-1 rounded-md text-xs border
        ${exclusive
          ? 'bg-red-600/20 text-red-400 border-red-600/40'
          : 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40'
        }`}
    >
      {policy}
    </span>
  )
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID')
}
