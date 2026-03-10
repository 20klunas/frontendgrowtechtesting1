'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { motion } from "framer-motion";
import PermissionGate from "../../components/admin/PermissionGate"

const API = process.env.NEXT_PUBLIC_API_URL

export default function KategoriPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('create') // create | edit | delete
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: ''
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
  const fetchCategories = async () => {
    setLoading(true)

    const res = await fetch(`${API}/api/v1/admin/categories`, {
      headers: authHeaders()
    })

    const json = await res.json()
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
      body: JSON.stringify({ name: form.name })
    })

    const json = await res.json()

    if (json.success) {
      fetchCategories()
      closeModal()
    } else {
      alert('Gagal menyimpan kategori')
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

    const json = await res.json()

    if (json.success) {
      fetchCategories()
      closeModal()
    } else {
      alert('Gagal menghapus kategori')
    }

    setSubmitting(false)
  }

  // ================= MODAL HELPERS =================
  const openCreate = () => {
    setMode('create')
    setForm({ name: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setForm({ name: item.name })
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
    <PermissionGate permission="manage_categories">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">
          Manajemen Kategori
        </h1>

        <motion.div
          className="
            rounded-2xl
            border border-purple-600/60
            bg-black
            p-6
            shadow-[0_0_25px_rgba(168,85,247,0.15)]
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex justify-end mb-4">
            <button className="btn-add" onClick={openCreate}>
              + Tambah
            </button>
          </div>

          {loading ? (
            <p className="text-purple-300">Loading...</p>
          ) : (
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th>ID</th>
                  <th>Nama Kategori</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-purple-900/20 text-center"
                  >
                    <td className="text-center">{item.id}</td>
                    <td className="text-white text-center">{item.name}</td>
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
                    <td colSpan="3" className="text-center py-6 text-purple-300">
                      Data kosong
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* ================= MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-md rounded-2xl border border-purple-600/60 bg-black p-6">
              {mode === 'delete' ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Hapus Kategori
                  </h3>
                  <p className="text-black dark:text-gray-300 mb-6">
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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {mode === 'edit' ? 'Edit' : 'Tambah'} Kategori
                  </h3>

                  <input
                    className="input-primary mb-4"
                    placeholder="Nama kategori"
                    value={form.name}
                    onChange={e => setForm({ name: e.target.value })}
                    required
                  />

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
    </PermissionGate>
  )
}
