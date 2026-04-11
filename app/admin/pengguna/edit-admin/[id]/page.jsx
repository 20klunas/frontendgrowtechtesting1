'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '../../../../lib/utils'

export default function EditAdminPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    name: '',
    role: 'admin',
  })

  useEffect(() => {
    if (id) fetchAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchAdmin() {
    try {
      setLoading(true)
      const res = await apiFetch(`/api/v1/admin/users/${id}`)
      const admin = res?.data || {}

      setForm({
        email: admin.email || '',
        full_name: admin.full_name || '',
        name: admin.name || '',
        role: admin.role === 'user' ? 'user' : 'admin',
      })
    } catch (error) {
      console.error('GET ADMIN ERROR:', error)
      alert(error?.message || 'Gagal memuat data admin')
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    try {
      setSaving(true)

      await apiFetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          email: form.email,
          full_name: form.full_name,
          name: form.name,
          role: form.role,
        }),
      })

      alert(
        form.role === 'user'
          ? 'Role admin berhasil diubah menjadi user'
          : 'Data admin berhasil diperbarui'
      )

      router.replace('/admin/admin-users')
    } catch (error) {
      console.error('UPDATE ADMIN ERROR:', error)
      alert(error?.message || 'Gagal update admin')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin px-6 py-10">
        <p className="modal-text">Loading admin data...</p>
      </div>
    )
  }

  return (
    <div className="admin px-6 py-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold modal-title">Edit Admin</h1>
        <p className="modal-text text-sm mt-1">
          Perbarui informasi akun dan ubah role admin menjadi user bila diperlukan.
        </p>
      </div>

      <div className="modal-card rounded-2xl p-8 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <h3 className="font-semibold text-lg mb-4 modal-title">Informasi Akun</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="modal-text text-sm block mb-1">Email</label>
            <input
              className="input-primary"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">Nama Lengkap</label>
            <input
              className="input-primary"
              value={form.full_name}
              onChange={(e) => setField('full_name', e.target.value)}
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">Username</label>
            <input
              className="input-primary"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">Role</label>
            <select
              className="input-primary"
              value={form.role}
              onChange={(e) => setField('role', e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 mb-8">
          <p className="text-sm text-yellow-200">
            Hak akses sistem tidak ditampilkan di halaman ini. Perubahan di sini fokus untuk data akun
            dan perpindahan role admin ke user.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg border border-gray-500 modal-text hover:bg-gray-700/20"
            disabled={saving}
          >
            Batal
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Update Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}