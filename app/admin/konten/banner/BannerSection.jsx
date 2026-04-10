'use client'

import { useEffect, useState } from 'react'
import SectionCard from '../../../components/admin/SectionCard'
import ActionButtons from '../../../components/admin/ActionButtons'
import StatusBadge from '../../../components/admin/StatusBadge'
import Modal from '../../../components/ui/Modal'
import Cookies from 'js-cookie'

export default function BannerSection() {
  const API = process.env.NEXT_PUBLIC_API_URL

  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [newImageUploaded, setNewImageUploaded] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)

  const SUPABASE_PUBLIC_BASE =
    'https://ajyzgqrpqghtvuwykevk.supabase.co/storage/v1/object/public/banners'

  const getBannerImageUrl = (image_path) => {
    if (!image_path) return ''
    return `${SUPABASE_PUBLIC_BASE}/${image_path}`
  }

  const [form, setForm] = useState({
    image_path: '',
    sort_order: 0,
    is_active: true,
    image_url: '',
  })

  /* ================= LOAD ================= */
  const loadBanners = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API}/api/v1/admin/banners`, {
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

      setBanners(list)
    } catch (err) {
      console.error('LOAD BANNERS ERROR:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  /* ================= TOGGLE ACTIVE ================= */
  const toggleActive = async (banner) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({
          is_active: !banner.is_active,
        }),
      })

      if (!res.ok) throw new Error()

      setBanners((prev) =>
        prev.map((b) =>
          b.id === banner.id ? { ...b, is_active: !b.is_active } : b
        )
      )
    } catch {
      alert('Gagal update status')
    }
  }

  /* ================= DRAG REORDER ================= */
  const handleDragStart = (banner) => {
    setDraggedItem(banner)
  }

  const handleDrop = async (targetBanner) => {
    if (!draggedItem || draggedItem.id === targetBanner.id) return

    const updated = [...banners]
    const fromIndex = updated.findIndex((b) => b.id === draggedItem.id)
    const toIndex = updated.findIndex((b) => b.id === targetBanner.id)

    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)

    // Recalculate sort_order
    const reordered = updated.map((b, i) => ({
      ...b,
      sort_order: i + 1,
    }))

    setBanners(reordered)

    try {
      await fetch(`${API}/api/v1/admin/banners/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({
          banners: reordered.map((b) => ({
            id: b.id,
            sort_order: b.sort_order,
          })),
        }),
      })
    } catch {
      alert('Gagal reorder banner')
    }

    setDraggedItem(null)
  }

  /* ================= SIGNED UPLOAD ================= */
  const handleImageUpload = async (file) => {
    if (!file) return
    setUploading(true)

    try {
      const res = await fetch(`${API}/api/v1/admin/banners/image/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({ mime: file.type }),
      })

      if (!res.ok) throw new Error('Signed URL gagal')

      const { data } = await res.json()

      const upload = await fetch(data.signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!upload.ok) throw new Error('Upload gagal')

      setForm((prev) => ({
        ...prev,
        image_path: data.path,
        image_url: URL.createObjectURL(file),
      }))

      setNewImageUploaded(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!editing && !form.image_path) {
      alert('Gambar wajib diupload')
      return
    }

    const url = editing
      ? `${API}/api/v1/admin/banners/${editing.id}`
      : `${API}/api/v1/admin/banners`

    const method = editing ? 'PATCH' : 'POST'

    const payload = {
      sort_order: form.sort_order,
      is_active: form.is_active,
    }

    if (!editing || newImageUploaded) {
      payload.image_path = form.image_path
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()

      setModalOpen(false)
      setEditing(null)
      setNewImageUploaded(false)
      loadBanners()
    } catch {
      alert('Gagal menyimpan banner')
    }
  }

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!confirm('Hapus banner ini?')) return

    await fetch(`${API}/api/v1/admin/banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })

    loadBanners()
  }

  const openEdit = (b) => {
    setEditing(b)
    setNewImageUploaded(false)

    setForm({
      image_path: b.image_path,
      sort_order: b.sort_order,
      is_active: b.is_active,
      image_url: getBannerImageUrl(b.image_path),
    })

    setModalOpen(true)
  }

  const openPreview = (image) => {
    setPreviewImage(image)
    setPreviewOpen(true)
  }

  return (
    <>
      <SectionCard title="Manajemen Banner">
        <div className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Daftar Banner</h2>

            <button
              onClick={() => {
                setEditing(null)
                setForm({
                  image_path: '',
                  sort_order: banners.length + 1,
                  is_active: true,
                  image_url: '',
                })
                setModalOpen(true)
              }}
              className="px-4 py-2 rounded-lg bg-green-500 text-black font-semibold hover:scale-105 transition"
            >
              + Tambah Banner
            </button>
          </div>

          {/* ================= SKELETON ================= */}
          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-purple-900/20 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ================= EMPTY STATE ================= */}
          {!loading && banners.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-lg">Belum ada banner</p>
              <p className="text-sm">Klik tombol tambah banner</p>
            </div>
          )}

          {/* ================= TABLE ================= */}
          {!loading && banners.length > 0 && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-purple-700 text-gray-300">
                  <tr>
                    <th className="py-3 text-center">Preview</th>
                    <th className="text-center">Urutan</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {banners.map((b) => (
                    <tr
                      key={b.id}
                      draggable
                      onDragStart={() => handleDragStart(b)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(b)}
                      className="border-b border-purple-800/40 hover:bg-purple-700/10"
                    >
                      <td className="py-3">
                        <img
                          src={getBannerImageUrl(b.image_path)}
                          onClick={() =>
                            openPreview(getBannerImageUrl(b.image_path))
                          }
                          className="h-14 mx-auto rounded-lg cursor-zoom-in"
                        />
                      </td>

                      <td className="text-center">{b.sort_order}</td>

                      <td className="text-center">
                        <button
                          onClick={() => toggleActive(b)}
                          className="hover:scale-105 transition"
                        >
                          <StatusBadge
                            status={b.is_active ? 'Aktif' : 'Nonaktif'}
                          />
                        </button>
                      </td>

                      <td className="text-center">
                        <ActionButtons
                          onEdit={() => openEdit(b)}
                          onDelete={() => handleDelete(b.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ================= FORM MODAL ================= */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Banner' : 'Tambah Banner'}
      >
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files[0])}
          />

          {form.image_url && (
            <img
              src={form.image_url}
              className="rounded-xl max-h-40 mx-auto"
            />
          )}

          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: Number(e.target.value) })
            }
            className="input"
          />

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />
            Aktif
          </label>

          <button
            onClick={handleSubmit}
            className="bg-green-500 text-black px-4 py-2 rounded-lg w-full"
          >
            Simpan
          </button>
        </div>
      </Modal>

      {/* ================= PREVIEW MODAL ================= */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Preview Banner"
      >
        <img
          src={previewImage}
          className="rounded-xl max-h-[70vh] mx-auto"
        />
      </Modal>
    </>
  )
}
