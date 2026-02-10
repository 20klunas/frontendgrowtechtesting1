'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Cookies from 'js-cookie'

const API = process.env.NEXT_PUBLIC_API_URL

export default function SubKategoriPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('create') // create | edit | delete
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    slug: '',
    provider: '',
    is_active: true,
    sort_order: 1
  })

  const authHeaders = () => {
    const token = Cookies.get('token')
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }


  // ================= FETCH =================
  const fetchAll = async () => {
    setLoading(true)

    const [subRes, catRes] = await Promise.all([
      fetch(`${API}/api/v1/admin/subcategories`, {
        headers: authHeaders()
      }),
      fetch(`${API}/api/v1/admin/categories`, {
        headers: authHeaders()
      })
    ])

    const subText = await subRes.text()
    const catText = await catRes.text()

    let subJson, catJson
    try {
      subJson = JSON.parse(subText)
      catJson = JSON.parse(catText)
    } catch (e) {
      console.error('Non JSON response:', subText, catText)
      alert('Server error (cek backend)')
      setLoading(false)
      return
    }

    setItems(subJson.data || [])
    setCategories(catJson.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const url =
      mode === 'edit'
        ? `${API}/api/v1/admin/subcategories/${selected.id}`
        : `${API}/api/v1/admin/subcategories`

    const method = mode === 'edit' ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(form)
    })

    const text = await res.text()
    let json

    try {
      json = JSON.parse(text)
    } catch {
      console.error(text)
      alert('Server error (response bukan JSON)')
      setSubmitting(false)
      return
    }

    if (json.success) {
      fetchAll()
      closeModal()
    } else {
      alert('Gagal menyimpan sub kategori')
    }

    setSubmitting(false)
  }

  // ================= DELETE =================
  const handleDelete = async () => {
    setSubmitting(true)

    const res = await fetch(
      `${API}/api/v1/admin/subcategories/${selected.id}`,
      {
        method: 'DELETE',
        headers: authHeaders()
      }
    )

    const text = await res.text()
    let json

    try {
      json = JSON.parse(text)
    } catch {
      console.error(text)
      alert('Server error')
      setSubmitting(false)
      return
    }

    if (json.success) {
      fetchAll()
      closeModal()
    } else {
      alert('Gagal menghapus sub kategori')
    }

    setSubmitting(false)
  }

  // ================= MODAL HELPERS =================
  const openCreate = () => {
    setMode('create')
    setForm({
      category_id: '',
      name: '',
      slug: '',
      provider: '',
      is_active: true,
      sort_order: 1
    })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setForm({
      category_id: item.category_id,
      name: item.name,
      slug: item.slug,
      provider: item.provider,
      is_active: item.is_active,
      sort_order: item.sort_order
    })
    setShowModal(true)
  }

  const openDelete = (item) => {
    setMode('delete')
    setSelected(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelected(null)
    setMode('create')
  }

  // ================= UI =================
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">
        Manajemen Produk
      </h1>

      <motion.div
        className="
          rounded-2xl
          border border-purple-600/60
          bg-black
          p-6
          transition-all duration-300
          shadow-[0_0_25px_rgba(168,85,247,0.15)]
          hover:shadow-[0_0_45px_rgba(168,85,247,0.35)]
          hover:border-purple-500
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Data Sub Kategori
        </h2>

        <div className="flex justify-end mb-4">
          <button className="btn-add" onClick={openCreate}>
            + Tambah
          </button>
        </div>

        {loading ? (
          <p className="text-purple-300">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th>ID</th>
                  <th>Gambar</th>
                  <th>Sub Kategori</th>
                  <th>Kategori</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-purple-900/20"
                  >
                    <td>{item.id}</td>

                    <td>
                      <div className="w-12 h-12 rounded bg-purple-900/40 flex items-center justify-center">
                        <Image
                          src="/placeholder.png"
                          alt="Sub kategori"
                          width={32}
                          height={32}
                        />
                      </div>
                    </td>

                    <td className="text-white">{item.name}</td>
                    <td className="text-purple-300">
                      {item.category?.name || '-'}
                    </td>
                    <td>{item.provider}</td>

                    <td className="text-center">
                      <span className={item.is_active ? 'badge-ready' : 'badge-danger'}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="text-center space-x-2">
                      <button
                        className="btn-edit-sm"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete-sm"
                        onClick={() => openDelete(item)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-purple-300">
                      Data kosong
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-purple-600/60 bg-black p-6">
            {mode === 'delete' ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Hapus Sub Kategori
                </h3>
                <p className="text-gray-300 mb-6">
                  Yakin ingin menghapus <b>{selected?.name}</b>?
                </p>

                <div className="flex justify-end gap-2">
                  <button className="btn-cancel" onClick={closeModal}>
                    Batal
                  </button>
                  <button
                    className="btn-delete-sm"
                    onClick={handleDelete}
                    disabled={submitting}
                  >
                    {submitting ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {mode === 'edit' ? 'Edit' : 'Tambah'} Sub Kategori
                </h3>

                {/* CATEGORY */}
                <select
                  className="input-primary mb-3"
                  value={form.category_id}
                  onChange={e =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  className="input-primary mb-3"
                  placeholder="Nama sub kategori"
                  value={form.name}
                  onChange={e =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <input
                  className="input-primary mb-3"
                  placeholder="Slug"
                  value={form.slug}
                  onChange={e =>
                    setForm({ ...form, slug: e.target.value })
                  }
                  required
                />

                <input
                  className="input-primary mb-3"
                  placeholder="Provider"
                  value={form.provider}
                  onChange={e =>
                    setForm({ ...form, provider: e.target.value })
                  }
                />

                <label className="flex items-center gap-2 text-sm text-purple-300 mb-4">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                  />
                  Aktif
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={closeModal}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-add"
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
