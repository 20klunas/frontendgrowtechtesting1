'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { motion } from 'framer-motion'
import PermissionGate from '../../components/admin/PermissionGate'

const API = process.env.NEXT_PUBLIC_API_URL

const emptyForm = {
  name: '',
  slug: '',
  redirect_link: '',
  sort_order: 0,
  is_active: true,
}

function buildHeaders() {
  const token = Cookies.get('token')
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function KategoriPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('create')
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`${API}/api/v1/admin/categories?${params.toString()}`, {
        headers: buildHeaders(),
      })
      const json = await res.json()
      setCategories(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      console.error(error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const openCreate = () => {
    setMode('create')
    setSelected(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      redirect_link: item.redirect_link || '',
      sort_order: Number(item.sort_order || 0),
      is_active: !!item.is_active,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelected(null)
    setMode('create')
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = mode === 'edit'
        ? `${API}/api/v1/admin/categories/${selected.id}`
        : `${API}/api/v1/admin/categories`

      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || slugify(form.name),
          redirect_link: form.redirect_link || null,
          sort_order: Number(form.sort_order || 0),
          is_active: !!form.is_active,
        }),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json?.error?.message || 'Gagal menyimpan kategori')

      await fetchCategories()
      closeModal()
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Gagal menyimpan kategori')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Yakin hapus kategori ${item.name}?`)) return

    try {
      const res = await fetch(`${API}/api/v1/admin/categories/${item.id}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json?.error?.message || 'Gagal menghapus kategori')
      await fetchCategories()
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Gagal menghapus kategori')
    }
  }

  const handleToggle = async (item) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/categories/${item.id}`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ is_active: !item.is_active }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json?.error?.message || 'Gagal mengubah status kategori')
      await fetchCategories()
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Gagal mengubah status kategori')
    }
  }

  return (
    <PermissionGate permission="manage_categories">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold text-white">Manajemen Kategori</h1>
          <button className="btn-add" onClick={openCreate}>+ Tambah</button>
        </div>

        <motion.div
          className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / slug kategori"
              className="rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <button onClick={fetchCategories} className="rounded-xl bg-purple-600 px-4 py-3 font-medium text-white hover:bg-purple-700">
              Terapkan Filter
            </button>
          </div>

          {loading ? (
            <p className="text-purple-300">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 pr-3">Nama</th>
                    <th className="py-3 pr-3">Slug</th>
                    <th className="py-3 pr-3">Redirect Link</th>
                    <th className="py-3 pr-3">Sort</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-purple-900/10">
                      <td className="py-4 pr-3 text-white">{item.name}</td>
                      <td className="py-4 pr-3">{item.slug || '-'}</td>
                      <td className="py-4 pr-3 max-w-[260px] break-all">{item.redirect_link || '-'}</td>
                      <td className="py-4 pr-3">{item.sort_order ?? 0}</td>
                      <td className="py-4 pr-3">
                        <button onClick={() => handleToggle(item)}>
                          <StatusBadge active={item.is_active} />
                        </button>
                      </td>
                      <td className="py-4 text-center space-x-2">
                        <button className="btn-edit-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn-delete-sm" onClick={() => handleDelete(item)}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-purple-300">Data kosong</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-2xl bg-black border border-purple-500/30 shadow-2xl shadow-purple-900/30 overflow-hidden">
              <div className="px-6 py-5 border-b border-purple-900/40">
                <h3 className="text-lg font-semibold text-white">
                  {mode === 'edit' ? 'Edit Kategori' : 'Tambah Kategori'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Nama Kategori</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value, slug: slugify(e.target.value) }))}
                    className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
                    placeholder="Nama kategori"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                    className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
                    placeholder="slug-kategori"
                  />
                </div>

                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Redirect Link</label>
                  <input
                    value={form.redirect_link}
                    onChange={(e) => setForm((prev) => ({ ...prev, redirect_link: e.target.value }))}
                    className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-purple-300 mb-1 block">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                      className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-purple-300 mb-1 block">Status</label>
                    <select
                      value={form.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'active' }))}
                      className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-purple-900/30">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/40 transition">
                    Batal
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition shadow-lg shadow-purple-900/40">
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${active ? 'bg-green-600/20 text-green-400 border-green-600/40' : 'bg-red-600/20 text-red-400 border-red-600/40'}`}>
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}
