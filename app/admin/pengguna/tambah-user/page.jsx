'use client'

import { useRouter } from "next/navigation"
import { useState } from "react"
import Cookies from "js-cookie"

export default function TambahUserPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL

  const [form, setForm] = useState({
    name: "",
    full_name: "",
    address: "",
    email: "",
    role: "user",
    tier: "member",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit() {
    setError(null)

    if (!form.email || !form.password || !form.name) {
      setError("Email, username, dan password wajib diisi")
      return
    }

    try {
      setLoading(true)
     
      const token = Cookies.get("token")
      if (!token) {
        setError("Session login habis, silakan login ulang")
        return
      }

      const payload = { ...form }

      if (payload.role === "admin") {
        delete payload.tier
      }

      const res = await fetch(`${API}/api/v1/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const text = await res.text()
      console.log("RAW RESPONSE:", text)

      let data
      try { data = JSON.parse(text) } catch { data = text }

      if (!res.ok) throw data

      router.push("/admin/pengguna")
    } catch (err) {
      console.error("CREATE USER ERROR:", err)
      setError(typeof err === "string" ? err : err?.message || "Gagal menambahkan user")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="px-6 py-10 text-white max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Tambah User</h1>

      <div className="rounded-2xl border border-purple-700 bg-black px-8 py-10">
        {error && (
          <div className="mb-6 rounded-lg bg-red-600/20 border border-red-600 text-red-400 px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">

          <Input label="Email" name="email" value={form.email} onChange={handleChange} />
          <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} />
          <Input label="Username" name="name" value={form.name} onChange={handleChange} />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />

          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="input">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {form.role === "user" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tier</label>
              <select name="tier" value={form.tier} onChange={handleChange} className="input">
                <option value="member">Member</option>
                <option value="reseller">Reseller</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="input" />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-12">
          <button onClick={() => router.back()} className="px-8 py-2 rounded-xl bg-white text-black font-semibold">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 rounded-xl bg-purple-700">
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <input className="input" {...props} />
    </div>
  )
}
