'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useParams } from "next/navigation"

export default function EditUserPage() {
  const params = useParams()
  const id = params?.id
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchUser = async () => {
      try {
        const token = Cookies.get("token")

        const res = await fetch(`${API}/api/v1/admin/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!res.ok) throw new Error("Gagal fetch user")

        const data = await res.json()
        setForm(data.data)
      } catch (err) {
        console.error("FETCH USER ERROR:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id, API])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleUpdate() {
    try {
      const token = Cookies.get("token")
      if (!token) throw new Error("Token tidak ditemukan")

      const payload = { ...form }

      if (payload.role === "admin") {
        delete payload.tier
      }

      const res = await fetch(`${API}/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      router.push("/admin/pengguna")
    } catch (err) {
      alert("Gagal update user")
      console.error("UPDATE USER ERROR:", err)
    }
  }


  if (loading) return <div className="p-10 text-white">Memuat data user...</div>
  if (!form) return <div className="p-10 text-red-400">User tidak ditemukan</div>

  return (
    <div className="px-6 py-10 text-white max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">Edit User</h1>
          <p className="text-gray-400 text-sm">
            Perbarui informasi akun dan hak akses pengguna
          </p>
        </div>

        <div className="flex items-center gap-3 bg-purple-900/30 px-4 py-2 rounded-xl border border-purple-700">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
            {form.name?.charAt(0) || "U"}
          </div>

          <div className="text-sm">
            <p className="text-white font-semibold">{form.name}</p>
            <p className="text-gray-400 text-xs">{form.email}</p>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="rounded-2xl border border-purple-700/60 bg-black backdrop-blur p-8 shadow-[0_0_25px_rgba(168,85,247,0.25)]">

        {/* ACCOUNT INFO */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-purple-400 mb-4">
            Informasi Akun
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div>
              <label className="text-xs text-gray-400">Email</label>
              <input
                className="input"
                name="email"
                value={form.email || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">Full Name</label>
              <input
                className="input"
                name="full_name"
                value={form.full_name || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">Username</label>
              <input
                className="input"
                name="name"
                value={form.name || ""}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-gray-400">Address</label>
              <input
                className="input"
                name="address"
                value={form.address || ""}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        {/* ACCESS CONTROL */}
        <div>
          <h2 className="text-lg font-semibold text-purple-400 mb-4">
            Hak Akses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ROLE */}
            <div>
              <label className="text-xs text-gray-400">Role</label>

              <select
                className="input"
                name="role"
                value={form.role || "user"}
                onChange={handleChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <p className="text-xs text-gray-500 mt-1">
                Admin memiliki akses penuh ke dashboard
              </p>
            </div>

            {/* TIER */}
            {form.role === "user" && (
              <div>
                <label className="text-xs text-gray-400">User Tier</label>

                <select
                  className="input"
                  name="tier"
                  value={form.tier || "member"}
                  onChange={handleChange}
                >
                  <option value="member">Member</option>
                  <option value="reseller">Reseller</option>
                  <option value="vip">VIP</option>
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Menentukan level akses fitur marketplace
                </p>
              </div>
            )}

            {/* STATUS BADGE */}
            <div className="flex items-end">
              <div className="flex gap-2">

                <span className="px-3 py-1 text-xs rounded-full bg-purple-600/20 text-purple-400 border border-purple-600/40">
                  Role: {form.role}
                </span>

                {form.tier && form.role === "user" && (
                  <span className="px-3 py-1 text-xs rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/40">
                    Tier: {form.tier}
                  </span>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="flex justify-end gap-4 mt-10">

          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg border border-gray-600 text-white hover:bg-gray-800 transition"
          >
            Batal
          </button>

          <button
            onClick={handleUpdate}
            className="px-7 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition shadow-[0_0_15px_rgba(168,85,247,0.6)]"
          >
            Simpan Perubahan
          </button>

        </div>

      </div>
    </div>
  )

}
