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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">

            {/* MODAL CARD */}
            <div className="w-full max-w-md rounded-2xl bg-black border border-purple-500/30 shadow-2xl shadow-purple-900/30 overflow-hidden">

              {mode === "delete" ? (
                <>
                  {/* HEADER */}
                  <div className="px-6 py-5 border-b border-purple-900/40">
                    <h3 className="text-lg font-semibold text-white">
                      Hapus Kategori
                    </h3>
                  </div>

                  {/* BODY */}
                  <div className="px-6 py-6 text-gray-300">
                    <p>
                      Yakin ingin menghapus kategori
                      <span className="text-purple-400 font-semibold">
                        {" "}
                        {selected?.name}
                      </span>
                      ?
                    </p>
                  </div>

                  {/* FOOTER */}
                  <div className="px-6 py-4 border-t border-purple-900/30 flex justify-end gap-3">

                    <button
                      className="
                        px-4 py-2
                        rounded-lg
                        border border-gray-600
                        text-gray-300
                        hover:bg-gray-700/40
                        transition
                      "
                      onClick={closeModal}
                    >
                      Batal
                    </button>

                    <button
                      className="
                        px-4 py-2
                        rounded-lg
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        transition
                        shadow-lg shadow-red-900/40
                      "
                      onClick={handleDelete}
                      disabled={submitting}
                    >
                      {submitting ? "Menghapus..." : "Hapus"}
                    </button>

                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmit}>

                  {/* HEADER */}
                  <div className="px-6 py-5 border-b border-purple-900/40">
                    <h3 className="text-lg font-semibold text-white">
                      {mode === "edit" ? "Edit Kategori" : "Tambah Kategori"}
                    </h3>
                  </div>

                  {/* BODY */}
                  <div className="px-6 py-6">

                    <label className="block text-sm text-gray-400 mb-2">
                      Nama Kategori
                    </label>

                    <input
                      className="
                        w-full
                        px-4
                        py-3
                        rounded-lg
                        bg-black/60
                        border border-purple-500/30
                        text-white
                        focus:outline-none
                        focus:ring-2
                        focus:ring-purple-500
                        transition
                      "
                      placeholder="Masukkan nama kategori"
                      value={form.name}
                      onChange={(e) => setForm({ name: e.target.value })}
                      required
                    />

                  </div>

                  {/* FOOTER */}
                  <div className="px-6 py-4 border-t border-purple-900/30 flex justify-end gap-3">

                    <button
                      type="button"
                      className="
                        px-4 py-2
                        rounded-lg
                        border border-gray-600
                        text-gray-300
                        hover:bg-gray-700/40
                        transition
                      "
                      onClick={closeModal}
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className="
                        px-4 py-2
                        rounded-lg
                        bg-purple-600
                        hover:bg-purple-700
                        text-white
                        transition
                        shadow-lg shadow-purple-900/40
                      "
                      disabled={submitting}
                    >
                      {submitting ? "Menyimpan..." : "Simpan"}
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
