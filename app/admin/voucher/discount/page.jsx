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
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  const loadDiscounts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/v1/admin/discount-campaigns`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      })
      const json = await res.json()
      const list = Array.isArray(json.data?.data) ? json.data.data : Array.isArray(json.data) ? json.data : []
      setDiscounts(list)
    } catch (err) {
      console.error(err)
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiscounts()
  }, [])

  const toggleEnabled = async (discount) => {
    await fetch(`${API}/api/v1/admin/discount-campaigns/${discount.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({ enabled: !discount.enabled }),
    })
    loadDiscounts()
  }

  const confirmDelete = async () => {
    if (!selectedId) return
    await fetch(`${API}/api/v1/admin/discount-campaigns/${selectedId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
    setOpenDelete(false)
    setSelectedId(null)
    loadDiscounts()
  }

  const filtered = useMemo(() => {
    const lower = search.toLowerCase()
    const list = discounts.filter((item) => {
      const haystack = [
        item.nama_discount,
        item.kategori_produk,
        item.sub_kategori,
        item.status,
        item.tier_summary,
      ].join(' ').toLowerCase()
      return haystack.includes(lower)
    })

    return list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av = a?.[sortKey] ?? ''
      const bv = b?.[sortKey] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [discounts, search, sortKey, sortDir])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPage) setPage(totalPage)
  }, [page, totalPage])

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Manajemen Discount</h1>
          <p className="text-sm text-gray-400 mt-2">Sudah mendukung konfigurasi discount berdasarkan tier user.</p>
        </div>
        <Link href="/admin/voucher/discount/add" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-700 w-fit">
          + Tambah Discount
        </Link>
      </div>

      <div className="rounded-2xl border border-purple-600/40 bg-purple-950/10 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <VoucherTabs />

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              className="rounded-xl bg-purple-900/30 border border-purple-600/30 px-4 h-11 text-sm w-full lg:w-80"
              placeholder="Cari discount / kategori / tier"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            <select className="rounded-xl bg-zinc-950 border border-purple-700/50 px-4 h-11" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="nama_discount">Nama</option>
              <option value="status">Status</option>
              <option value="sub_kategori">Subkategori</option>
            </select>
            <select className="rounded-xl bg-zinc-950 border border-purple-700/50 px-4 h-11" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="desc">DESC</option>
              <option value="asc">ASC</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-purple-700/30 p-6 text-gray-400">Loading...</div>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border border-purple-700/30 p-6 text-gray-400">Discount tidak ditemukan.</div>
      ) : (
        <div className="space-y-4">
          {paginated.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-purple-700/40 bg-[#0b0612] p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                <Block label="Nama" value={item.nama_discount} bold />
                <Block label="Nominal" value={item.nominal} />
                <Block label="Kategori" value={item.kategori_produk} />
                <Block label="Subkategori" value={item.sub_kategori} />
                <Block label="Tier" value={item.tier_summary || 'Semua tier'} />
                <Block label="Priority" value={item.priority ?? 0} />
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <span>Status: <StatusBadge active={item.enabled} label={item.status} /></span>
                  <span>Starts: {item.starts_at ? new Date(item.starts_at).toLocaleString('id-ID') : '-'}</span>
                  <span>Ends: {item.ends_at ? new Date(item.ends_at).toLocaleString('id-ID') : '-'}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleEnabled(item)} className="rounded-lg border border-purple-600 px-4 py-2 text-sm hover:bg-purple-700/20">
                    {item.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <Link href={`/admin/voucher/discount/edit/${item.id}`} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-black">
                    Edit
                  </Link>
                  <button onClick={() => { setSelectedId(item.id); setOpenDelete(true) }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium">
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-end items-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-lg border border-purple-700 px-4 py-2 disabled:opacity-40">Prev</button>
        <span>{page} / {totalPage}</span>
        <button disabled={page >= totalPage} onClick={() => setPage((prev) => Math.min(totalPage, prev + 1))} className="rounded-lg border border-purple-700 px-4 py-2 disabled:opacity-40">Next</button>
      </div>

      <ConfirmDeleteModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        title="Hapus Discount"
        message="Yakin ingin menghapus discount ini?"
      />
    </div>
  )
}

function Block({ label, value, bold = false }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={bold ? 'font-semibold text-lg text-white' : 'text-gray-100'}>{value || '-'}</div>
    </div>
  )
}

function StatusBadge({ active, label }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{label || (active ? 'Aktif' : 'Nonaktif')}</span>
}
