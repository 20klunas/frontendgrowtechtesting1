'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import Cookies from 'js-cookie'
import { motion } from 'framer-motion'
import { authFetch } from '../../lib/authFetch'
import { X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

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

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    slug: '',
    provider: '',
    description: '',
    image_url: '',
    image_path: '',
    is_active: true,
    sort_order: 1,
  })

  const generateSlug = (text) => {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  // ✅ FIX: jangan pakai "new Image()" karena Image sudah dipakai NextImage
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

  // ================= FETCH =================
  const fetchAll = async () => {
    setLoading(true)
    try {
      const [subJson, catJson] = await Promise.all([
        authFetch('/api/v1/admin/subcategories'),
        authFetch('/api/v1/admin/categories'),
      ])

      setItems(subJson.data || [])
      setCategories(catJson.data || [])

    } catch (err) {
      console.error('FETCH ERROR:', err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchAll()
  }, [])

  // ESC close + lock scroll
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

  // ================= HANDLE IMAGE UPLOAD =================
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

      // compress -> output jpeg
      const compressedFile = await compressImage(file)

      // 1) SIGN (Laravel)
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
        console.log('SIGN ERROR:', signJson)
        throw new Error(signJson?.error?.message || 'Gagal generate signed URL')
      }

      const { signedUrl, path, publicUrl } = signJson.data || {}
      if (!signedUrl || !path || !publicUrl) {
        throw new Error('Response signed URL tidak lengkap')
      }

      // 2) UPLOAD (Supabase) -> PUT ke signedUrl
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

      // 3) SET FORM
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

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (uploading) {
      alert('Tunggu upload selesai dulu ya.')
      return
    }

    setSubmitting(true)

    try {
      const endpoint =
        mode === 'edit'
          ? `/api/v1/admin/subcategories/${selected?.id}`
          : `/api/v1/admin/subcategories`

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

      console.log('PAYLOAD:', payload)

      const json = await authFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      if (!json?.success) {
        console.log('SAVE ERROR:', json)
        throw new Error(json?.error?.message || 'Gagal menyimpan')
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


  const handleDelete = async () => {
    if (!selected?.id) return
    setSubmitting(true)

    try {
      await authFetch(`/api/v1/admin/subcategories/${selected.id}`, {
        method: 'DELETE',
      })

      await fetchAll()
      closeModal()
    } catch (err) {
      console.error(err)
      alert('Gagal menghapus')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreate = () => {
    setMode('create')
    setSelected(null)
    setPreview(null)
    setForm({
      category_id: '',
      name: '',
      slug: '',
      provider: '',
      description: '',
      image_url: '',
      image_path: '',
      is_active: true,
      sort_order: 1,
    })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setPreview(item?.image_url || null)
    setForm({
      category_id: item.category_id,
      name: item.name,
      slug: item.slug,
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
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Manajemen Sub Kategori</h1>

      <motion.div
        className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex justify-end mb-4">
          <button className="btn-add" onClick={openCreate}>
            + Tambah
          </button>
        </div>

        {loading ? (
          <p className="text-gray-300">Loading...</p>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="border-b border-white/10">
                <th>ID</th>
                <th>Logo</th>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Provider</th>
                <th>Description</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 text-center">
                  <td>{item.id}</td>
                  <td className="items-center justify-center flex">
                    {item.image_url ? (
                      <NextImage src={item.image_url} width={40} height={40} alt="" />
                    ) : (
                      <span className="text-white/30 text-center">-</span>
                    )}
                  </td>
                  <td className="text-center">{item.name}</td>
                  <td className="text-center">{item.category?.name}</td>
                  <td className="text-center">{item.provider}</td>
                  <td className="text-center">{item.description || '-'}</td>
                  <td className="space-x-2">
                    <button onClick={() => openEdit(item)} className="btn-edit-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelected(item)
                        if (confirm('Yakin hapus sub kategori ini?')) handleDelete()
                      }}
                      className="btn-delete-sm"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* MODAL */}
      {showModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-black p-6 rounded-2xl border border-purple-600/60 shadow-[0_0_40px_rgba(168,85,247,0.25)]"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-purple-600 transition text-white"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleSubmit}>
              <select
                className="input-primary mb-3"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                className="input-primary mb-3"
                placeholder="Nama"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value
                  setForm({
                    ...form,
                    name,
                    slug: generateSlug(name),
                  })
                }}
                required
              />

              <input className="input-primary mb-3" placeholder="Slug" value={form.slug} readOnly />

              <input
                className="input-primary mb-3"
                placeholder="Provider"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              />

              <input
                className="input-primary mb-3"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <input
                type="file"
                className="mb-3"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />

              {uploading && (
                <div className="mb-3">
                  <div className="w-full bg-purple-900/40 rounded h-2">
                    <div
                      className="bg-purple-500 h-2 rounded transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-300 mt-1">Uploading... {progress}%</p>
                </div>
              )}

              {preview && (
                <div className="mb-3">
                  <NextImage src={preview} width={80} height={80} alt="preview" />
                </div>
              )}

              <button className="btn-add w-full" disabled={submitting || uploading}>
                {submitting ? 'Menyimpan...' : uploading ? 'Uploading...' : 'Simpan'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}