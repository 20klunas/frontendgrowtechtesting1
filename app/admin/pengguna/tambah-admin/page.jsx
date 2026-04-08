'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PERMISSIONS } from "../../../lib/permissions"
import { apiFetch } from "../../../lib/utils"

export default function TambahAdminPage() {
  const router = useRouter()
  const permissionList = useMemo(() => Object.values(PERMISSIONS), [])

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    name: "",
    password: "",
    role: "admin",
    permissions: [],
  })

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const togglePermission = (permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const handleSubmit = async () => {
    if (!form.email || !form.name || !form.password) {
      alert("Email, username, dan password wajib diisi")
      return
    }

    try {
      setSaving(true)

      const created = await apiFetch("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          full_name: form.full_name || null,
          password: form.password,
          role: "admin",
        }),
      })

      const adminId = created?.data?.id

      if (adminId && form.permissions.length > 0) {
        await apiFetch(`/api/v1/admin/users/${adminId}`, {
          method: "PATCH",
          body: JSON.stringify({ permissions: form.permissions }),
        }).catch(() => {})
      }

      alert("Admin berhasil ditambahkan")
      router.replace("/admin/admin-users")
    } catch (error) {
      alert(error?.message || "Gagal menambahkan admin")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin px-6 py-8 text-white max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Tambah Admin</h1>

      <div className="rounded-2xl border border-purple-700 bg-black p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input className="input-primary" placeholder="Email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
          <input className="input-primary" placeholder="Full Name" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
          <input className="input-primary" placeholder="Username" value={form.name} onChange={(e) => setField("name", e.target.value)} />

          <select className="input-primary" value={form.role} onChange={(e) => setField("role", e.target.value)} disabled>
            <option value="admin">Admin</option>
          </select>

          <input type="password" className="input-primary md:col-span-2" placeholder="Password" value={form.password} onChange={(e) => setField("password", e.target.value)} />
        </div>

        <h3 className="font-semibold mb-3">Hak Akses</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {permissionList.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} />
              {p}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-white text-black">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 rounded-lg bg-purple-700 disabled:opacity-60">
            {saving ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  )
}
