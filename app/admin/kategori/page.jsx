'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'

const API = process.env.NEXT_PUBLIC_API_URL

export default function KategoriPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('create') // create | edit | delete
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    is_active: true,
    sort_order: 1
  })

  // ================= FETCH =================
  const fetchCategories = async () => {
    setLoading(true)
    const token = Cookies.get('token')
    const res = await fetch(`${API}/api/v1/admin/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    })
    const text = await res.text()

    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      console.error('API returned non-JSON:', text)
      alert('Server error, cek backend')
      return
    }

    setCategories(json.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const url =
      mode === 'edit'
        ? `${API}/api/v1/admin/categories/${selected.id}`
        : `${API}/api/v1/admin/categories`

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
    } catch (e) {
      console.error('API returned non-JSON:', text)
      alert('Server error, cek backend')
      return
    }


    if (json.success) {
      fetchCategories()
      closeModal()
    } else {
      alert('Gagal menyimpan data')
    }

    setSubmitting(false)
  }

  // ================= DELETE =================
  const handleDelete = async () => {
    setSubmitting(true)

    const res = await fetch(
      `${API}/api/v1/admin/categories/${selected.id}`,
      {
        method: 'DELETE',
        headers: authHeaders()
      }
    )


    const text = await res.text()

    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      console.error('API returned non-JSON:', text)
      alert('Server error, cek backend')
      return
    }


    if (json.success) {
      fetchCategories()
      closeModal()
    } else {
      alert('Gagal menghapus data')
    }

    setSubmitting(false)
  }

  // ================= MODAL HELPERS =================
  const openCreate = () => {
    setMode('create')
    setForm({
      name: '',
      slug: '',
      is_active: true,
      sort_order: 1
    })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setForm({
      name: item.name,
      slug: item.slug,
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
      <h1 className="text-3xl font-bold text-white">Manajemen Produk</h1>

      <div className="rounded-2xl border border-purple-600/60 bg-black p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Data Kategori
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
                  <th>Kategori</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {categories.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-purple-900/20"
                  >
                    <td>{item.id}</td>
                    <td className="text-white">{item.name}</td>
                    <td className="text-purple-300">{item.slug}</td>
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

                {categories.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-purple-300">
                      Data kosong
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-purple-600/60 bg-black p-6">
            {mode === 'delete' ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Hapus Kategori
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
                  {mode === 'edit' ? 'Edit' : 'Tambah'} Kategori
                </h3>

                <input
                  className="input-primary mb-3"
                  placeholder="Nama kategori"
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
