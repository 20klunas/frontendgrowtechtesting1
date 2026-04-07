'use client'

import { useRouter } from "next/navigation"
import { PERMISSIONS } from "../../../lib/permissions"

export default function TambahAdminPage() {
  const router = useRouter()

  // Ubah object PERMISSIONS jadi array
  const permissionList = Object.values(PERMISSIONS)

  return (
    <div className="px-6 py-8 text-white max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Tambah Admin</h1>

      <div className="rounded-2xl border border-purple-700 bg-black p-6">

        {/* DATA ADMIN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input className="input" placeholder="Email" />
          <input className="input" placeholder="Full Name" />
          <input className="input" placeholder="Username" />

          <select className="input" defaultValue="admin">
            <option value="admin">Admin</option>
            
          </select>

          <input
            type="password"
            className="input md:col-span-2"
            placeholder="Password"
          />
        </div>

        {/* HAK AKSES */}
        <h3 className="font-semibold mb-3">Hak Akses</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {permissionList.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input type="checkbox" />
              {p}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg bg-white text-black"
          >
            Batal
          </button>
          <button className="px-6 py-2 rounded-lg bg-purple-700">
            Tambah
          </button>
        </div>
      </div>
    </div>
  )
}
