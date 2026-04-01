'use client'

import { useEffect, useMemo, useState } from 'react'
import NextImage from 'next/image'
import Cookies from 'js-cookie'
import { motion } from 'framer-motion'
import { authFetch } from '../../lib/authFetch'
import { X } from 'lucide-react'
import PermissionGate from '../../components/admin/PermissionGate'

const API = process.env.NEXT_PUBLIC_API_URL

const emptyForm = {
  category_id: '',
  name: '',
  slug: '',
  provider: '',
  description: '',
  image_url: '',
  image_path: '',
  is_active: true,
  sort_order: 1,
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function SubKategoriPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('create')
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const activeCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter((cat) => cat.is_active !== false) : []),
    [categories]
  )

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target.result

        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const maxWidth = 800
          const scale = Math.min(1, maxWidth / img.width)

          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Failed to compress image'))
              const safeName = file.name.replace(/\.\w+$/, '.jpg')
              resolve(new File([blob], safeName, { type: 'image/jpeg' }))
            },
            'image/jpeg',
            0.8
          )
        }

        img.onerror = () => reject(new Error('Invalid image'))
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const subParams = new URLSearchParams()
      if (search) subParams.set('q', search)
      if (statusFilter) subParams.set('status', statusFilter)

      const [subJson, catJson] = await Promise.all([
        authFetch(`/api/v1/admin/subcategories?${subParams.toString()}`),
        authFetch('/api/v1/admin/categories'),
      ])

      setItems(Array.isArray(subJson.data) ? subJson.data : [])
      setCategories(Array.isArray(catJson.data) ? catJson.data : [])
    } catch (err) {
      console.error('FETCH ERROR:', err)
      alert(err?.message || 'Gagal memuat data subkategori')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  useEffect(() => {
    if (!showModal) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal()
    }

    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [showModal])

  const handleImageUpload = async (file) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 2 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      alert('Format harus JPG, PNG, atau WEBP')
      return
    }

    if (file.size > maxSize) {
      alert('Ukuran maksimal 2MB')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const token = Cookies.get('token')
      if (!token) throw new Error('Token tidak ditemukan, silakan login ulang')

      const compressedFile = await compressImage(file)

      const signRes = await fetch(`${API}/api/v1/admin/subcategories/logo/sign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ mime: compressedFile.type }),
      })

      const signJson = await signRes.json()

      if (!signRes.ok || !signJson?.success) {
        throw new Error(signJson?.error?.message || 'Gagal generate signed URL')
      }

      const { signedUrl, path, publicUrl } = signJson.data || {}
      if (!signedUrl || !path || !publicUrl) {
        throw new Error('Response signed URL tidak lengkap')
      }

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedUrl)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.setRequestHeader('Content-Type', compressedFile.type)
        xhr.send(compressedFile)
      })

      setForm((prev) => ({
        ...prev,
        image_url: publicUrl,
        image_path: path,
      }))
      setPreview(publicUrl)
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Upload error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (uploading) {
      alert('Tunggu upload selesai dulu ya.')
      return
    }

    setSubmitting(true)
    try {
      const endpoint = mode === 'edit'
        ? `/api/v1/admin/subcategories/${selected?.id}`
        : '/api/v1/admin/subcategories'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const payload = {
        category_id: Number(form.category_id),
        name: form.name,
        slug: form.slug,
        provider: form.provider || null,
        description: form.description || null,
        image_url: form.image_url || null,
        image_path: form.image_path || null,
        is_active: !!form.is_active,
        sort_order: Number(form.sort_order) || 1,
      }

      const json = await authFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      if (!json?.success) {
        throw new Error(json?.error?.message || 'Gagal menyimpan subkategori')
      }

      await fetchAll()
      closeModal()
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!item?.id) return
    if (!confirm(`Yakin hapus subkategori ${item.name}?`)) return

    setSubmitting(true)
    try {
      await authFetch(`/api/v1/admin/subcategories/${item.id}`, {
        method: 'DELETE',
      })
      await fetchAll()
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Gagal menghapus subkategori')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (item) => {
    try {
      const json = await authFetch(`/api/v1/admin/subcategories/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !item.is_active }),
      })

      if (!json?.success) {
        throw new Error(json?.error?.message || 'Gagal mengubah status subkategori')
      }

      await fetchAll()
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Gagal mengubah status subkategori')
    }
  }

  const openCreate = () => {
    setMode('create')
    setSelected(null)
    setPreview(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setPreview(item?.image_url || null)
    setForm({
      category_id: item.category_id || '',
      name: item.name || '',
      slug: item.slug || '',
      provider: item.provider || '',
      description: item.description || '',
      image_url: item.image_url || '',
      image_path: item.image_path || '',
      is_active: !!item.is_active,
      sort_order: item.sort_order || 1,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelected(null)
    setMode('create')
    setPreview(null)
    setForm(emptyForm)
    setProgress(0)
  }

  return (
    <PermissionGate permission="manage_subcategories">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold text-white">Manajemen Sub Kategori</h1>
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
              placeholder="Cari subkategori / kategori / provider"
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
            <button onClick={fetchAll} className="rounded-xl bg-purple-600 px-4 py-3 font-medium text-white hover:bg-purple-700">
              Terapkan Filter
            </button>
          </div>

          {loading ? (
            <p className="text-gray-300">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 pr-3">Logo</th>
                    <th className="py-3 pr-3">Nama</th>
                    <th className="py-3 pr-3">Kategori</th>
                    <th className="py-3 pr-3">Provider</th>
                    <th className="py-3 pr-3">Deskripsi</th>
                    <th className="py-3 pr-3">Sort</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-purple-900/10">
                      <td className="py-4 pr-3">
                        {item.image_url ? (
                          <NextImage src={item.image_url} width={44} height={44} alt={item.name} className="rounded-lg object-cover" />
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="py-4 pr-3 text-white">{item.name}</td>
                      <td className="py-4 pr-3">{item.category?.name || '-'}</td>
                      <td className="py-4 pr-3">{item.provider || '-'}</td>
                      <td className="py-4 pr-3 max-w-[260px]">{item.description || '-'}</td>
                      <td className="py-4 pr-3">{item.sort_order || 1}</td>
                      <td className="py-4 pr-3">
                        <button onClick={() => handleToggle(item)}>
                          <StatusBadge active={item.is_active} />
                        </button>
                      </td>
                      <td className="py-4 text-center space-x-2">
                        <button onClick={() => openEdit(item)} className="btn-edit-sm">Edit</button>
                        <button onClick={() => handleDelete(item)} className="btn-delete-sm">Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-purple-300">Data kosong</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-2xl border border-purple-600/60 bg-black shadow-[0_0_40px_rgba(168,85,247,0.25)] overflow-hidden"
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-purple-600 transition text-white"
              >
                <X size={18} />
              </button>

              <div className="px-6 py-4 border-b border-purple-900/40">
                <h3 className="text-lg font-semibold text-white">
                  {mode === 'edit' ? 'Edit Subkategori' : 'Tambah Subkategori'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Atur subkategori, status hide/unhide, urutan, dan gambar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm block mb-1 text-gray-300">Kategori</label>
                    <select
                      className="input-primary"
                      value={form.category_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm block mb-1 text-gray-300">Status</label>
                    <select
                      className="input-primary"
                      value={form.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'active' }))}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm block mb-1 text-gray-300">Nama Subkategori</label>
                    <input
                      className="input-primary"
                      placeholder="Nama subkategori"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setForm((prev) => ({
                          ...prev,
                          name,
                          slug: slugify(name),
                        }))
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm block mb-1 text-gray-300">Slug</label>
                    <input
                      className="input-primary"
                      placeholder="slug-subkategori"
                      value={form.slug}
                      onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm block mb-1 text-gray-300">Provider</label>
                    <input
                      className="input-primary"
                      placeholder="Provider"
                      value={form.provider}
                      onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm block mb-1 text-gray-300">Sort Order</label>
                    <input
                      type="number"
                      className="input-primary"
                      value={form.sort_order}
                      min={1}
                      onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm block mb-1 text-gray-300">Deskripsi</label>
                  <textarea
                    className="input-primary min-h-[90px]"
                    placeholder="Deskripsi subkategori"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm block mb-2 text-gray-300">Gambar Subkategori</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                </div>

                {uploading && (
                  <div>
                    <div className="w-full bg-purple-900/40 rounded h-2 overflow-hidden">
                      <div className="bg-purple-500 h-2 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-purple-300 mt-1">Uploading... {progress}%</p>
                  </div>
                )}

                {preview && (
                  <div className="flex items-center gap-3 border border-purple-900/30 rounded-lg p-3">
                    <NextImage src={preview} width={70} height={70} alt="preview" className="rounded-md object-cover" />
                    <div className="text-sm text-gray-400 break-all">
                      Preview gambar subkategori
                      <div className="mt-1 text-xs text-gray-500">{form.image_path || '-'}</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-purple-900/30">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/40 transition">
                    Batal
                  </button>
                  <button className="btn-add" disabled={submitting || uploading}>
                    {submitting ? 'Menyimpan...' : uploading ? 'Uploading...' : 'Simpan Subkategori'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        <style jsx>{`
          .input-primary {
            width: 100%;
            border-radius: 12px;
            border: 1px solid rgba(126, 34, 206, 0.45);
            background: rgba(9, 9, 11, 0.95);
            padding: 12px 14px;
            color: white;
          }
          .input-primary:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.25);
            border-color: rgba(168, 85, 247, 0.7);
          }
        `}</style>
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
