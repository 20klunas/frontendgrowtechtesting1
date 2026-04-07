'use client'

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { PERMISSIONS } from "../../../../lib/permissions"
import { email } from "zod"

const API = process.env.NEXT_PUBLIC_API_URL

export default function EditAdminPage() {

  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const permissionList = Object.values(PERMISSIONS)

  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    name: "",
    role: "admin",
    permissions: []
  })

  useEffect(() => {
    if (id) {
      fetchAdmin()
    }
  }, [id])

  async function fetchAdmin() {
    try {

      const token = Cookies.get("token")

      const res = await fetch(`${API}/api/v1/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const json = await res.json()

      if (json.success) {

        const admin = json.data

        setForm({
          email: admin.email || "",
          full_name: admin.full_name || "",
          name: admin.name || "",
          role: admin.role || "admin",
          permissions: admin.permissions || []
        })

      }

    } catch (err) {
      console.error("GET ADMIN ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  function handlePermissionChange(permission) {

    if (form.permissions.includes(permission)) {

      setForm({
        ...form,
        permissions: form.permissions.filter(p => p !== permission)
      })

    } else {

      setForm({
        ...form,
        permissions: [...form.permissions, permission]
      })

    }

  }

  async function handleSubmit() {

    try {

      const token = Cookies.get("token")

      await fetch(`${API}/api/v1/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      alert("Admin berhasil diperbarui")

      router.push("/admin/pengguna")

    } catch (err) {
      console.error(err)
      alert("Gagal update admin")
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

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold modal-title">
          Edit Admin
        </h1>

        <p className="modal-text text-sm mt-1">
          Perbarui informasi akun admin dan hak aksesnya
        </p>
      </div>

      {/* CARD */}
      <div className="modal-card rounded-2xl p-8 shadow-[0_0_30px_rgba(168,85,247,0.15)]">

        {/* INFORMASI ADMIN */}
        <h3 className="font-semibold text-lg mb-4 modal-title">
          Informasi Admin
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <div>
            <label className="modal-text text-sm block mb-1">
              Email
            </label>

            <input
              className="input-primary"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">
              Nama Lengkap
            </label>

            <input
              className="input-primary"
              value={form.full_name}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">
              Username
            </label>

            <input
              className="input-primary"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">
              Role
            </label>

            <select
              className="input-primary"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="admin">Admin</option>
              
            </select>
          </div>

        </div>

        {/* PERMISSIONS */}
        <h3 className="font-semibold text-lg mb-4 modal-title">
          Hak Akses Sistem
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

          {permissionList.map((p) => (

            <label
              key={p}
              className="flex items-center gap-3 border border-purple-700/40 rounded-lg px-4 py-3 cursor-pointer hover:bg-purple-700/10"
            >

              <input
                type="checkbox"
                checked={form.permissions.includes(p)}
                onChange={() => handlePermissionChange(p)}
                className="accent-purple-600"
              />

              <span className="modal-text text-sm">
                {p}
              </span>

            </label>

          ))}

        </div>

        {/* BUTTON */}
        <div className="flex justify-end gap-3">

          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg border border-gray-500 modal-text hover:bg-gray-700/20"
          >
            Batal
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-semibold"
          >
            Update Admin
          </button>

        </div>

      </div>

    </div>
  )
}