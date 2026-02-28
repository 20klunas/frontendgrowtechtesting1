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
    <div className="px-6 py-8 text-white max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Edit User</h1>

      <div className="rounded-2xl border border-purple-700 bg-black p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="input" name="email" value={form.email || ""} onChange={handleChange} />
          <input className="input" name="full_name" value={form.full_name || ""} onChange={handleChange} />
          <input className="input" name="name" value={form.name || ""} onChange={handleChange} />
          <input className="input" name="address" value={form.address || ""} onChange={handleChange} />

          <select
            className="input"
            name="role"
            value={form.role || "user"}
            onChange={handleChange}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {form.role === "user" && (
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
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-white text-black">
            Batal
          </button>
          <button onClick={handleUpdate} className="px-6 py-2 rounded-lg bg-purple-700">
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
