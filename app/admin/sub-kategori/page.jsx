'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Cookies from 'js-cookie'
import { motion } from "framer-motion";
import { authFetch } from "../../lib/authFetch";

// import { supabase } from '../../lib/supabaseClient'

const API = process.env.NEXT_PUBLIC_API_URL
// const SUPABASE_BUCKET = 'subcategories'

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
    image_url: '',
    image_path: '',
    is_active: true,
    sort_order: 1
  })

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const authHeaders = () => {
    const token = Cookies.get('token')
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result

        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          const maxWidth = 800
          const scale = maxWidth / img.width

          canvas.width = maxWidth
          canvas.height = img.height * scale

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            },
            'image/jpeg',
            0.8
          )
        }
      }
    })
  }


  // ================= FETCH =================
  const fetchAll = async () => {
    setLoading(true);

    try {
      const [subRes, catRes] = await Promise.all([
        authFetch("/api/v1/admin/subcategories"),
        authFetch("/api/v1/admin/categories"),
      ]);

      const subJson = await subRes.json();
      const catJson = await catRes.json();

      setItems(subJson.data || []);
      setCategories(catJson.data || []);
    } catch (err) {
      alert("Gagal mengambil data");
    }

    setLoading(false);
  };


  useEffect(() => {
    fetchAll()
  }, [])

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

    const token = Cookies.get('token')

    const slug = generateSlug(form.name || 'logo')
    const fileName = `${slug}-${Date.now()}.jpg`

    const compressedFile = await compressImage(file)

    const signRes = await authFetch(
      "/api/v1/admin/subcategories/logo/sign",
      {
        method: "POST",
        body: JSON.stringify({ filename: fileName }),
      }
    );

    const signJson = await signRes.json()

    if (!signJson.success) {
      alert('Gagal generate signed URL')
      setUploading(false)
      return
    }

    const { signedUrl, path, publicUrl } = signJson.data

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) resolve()
        else reject()
      }

      xhr.onerror = reject

      xhr.setRequestHeader('Content-Type', 'image/jpeg')
      xhr.send(compressedFile)
    })

    setForm(prev => ({
      ...prev,
      image_url: publicUrl,
      image_path: path
    }))

    setPreview(publicUrl)
    setUploading(false)
  }

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);


  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const endpoint =
      mode === "edit"
        ? `/api/v1/admin/subcategories/${selected.id}`
        : `/api/v1/admin/subcategories`;

    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await authFetch(endpoint, {
      method,
      body: JSON.stringify({
        category_id: Number(form.category_id),
        name: form.name,
        slug: form.slug,
        provider: form.provider,
        image_url: form.image_url,
        image_path: form.image_path,
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      }),
    });

    const json = await res.json();

    if (json.success) {
      fetchAll();
      closeModal();
    } else {
      alert("Gagal menyimpan");
    }

    setSubmitting(false);
  };

  const handleDelete = async () => {
    setSubmitting(true);

    await authFetch(`/api/v1/admin/subcategories/${selected.id}`, {
      method: "DELETE",
    });

    fetchAll();
    closeModal();
    setSubmitting(false);
  };


  const openCreate = () => {
    setMode('create')
    setPreview(null)
    setForm({
      category_id: '',
      name: '',
      slug: '',
      provider: '',
      image_url: '',
      image_path: '',
      is_active: true,
      sort_order: 1
    })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setMode('edit')
    setSelected(item)
    setPreview(item.image_url)
    setForm({
      category_id: item.category_id,
      name: item.name,
      slug: item.slug,
      provider: item.provider,
      image_url: item.image_url,
      image_path: item.image_path,
      is_active: item.is_active,
      sort_order: item.sort_order
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

      <h1 className="text-3xl font-bold text-white">
        Manajemen Sub Kategori
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

        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-white/10">
              <th>ID</th>
              <th>Logo</th>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Provider</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {item.image_url && (
                    <Image src={item.image_url} width={40} height={40} alt="" />
                  )}
                </td>
                <td>{item.name}</td>
                <td>{item.category?.name}</td>
                <td>{item.provider}</td>
                <td className="space-x-2">
                  <button onClick={() => openEdit(item)} className="btn-edit-sm">Edit</button>
                  <button onClick={() => setSelected(item)} className="btn-delete-sm">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="w-full max-w-md bg-black p-6 rounded-2xl border border-purple-600/60">

            <form onSubmit={handleSubmit}>
              <select
                className="input-primary mb-3"
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <input
                className="input-primary mb-3"
                placeholder="Nama"
                value={form.name}
                onChange={e => {
                  const name = e.target.value
                  setForm({
                    ...form,
                    name,
                    slug: generateSlug(name)
                  })
                }}
                required
              />

              <input
                className="input-primary mb-3"
                placeholder="Slug"
                value={form.slug}
                readOnly
              />

              <input
                className="input-primary mb-3"
                placeholder="Provider"
                value={form.provider}
                onChange={e => setForm({ ...form, provider: e.target.value })}
              />

              <input
                type="file"
                className="mb-3"
                accept="image/*"
                onChange={e => handleImageUpload(e.target.files[0])}
              />
              {uploading && (
                <div className="mb-3">
                  <div className="w-full bg-purple-900/40 rounded h-2">
                    <div
                      className="bg-purple-500 h-2 rounded transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    Uploading... {progress}%
                  </p>
                </div>
              )}

              {preview && (
                <div className="mb-3">
                  <Image src={preview} width={80} height={80} alt="preview" />
                </div>
              )}

              <button className="btn-add w-full" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>

            </form>

          </div>
        </div>
      )}
    </div>
  )
}
