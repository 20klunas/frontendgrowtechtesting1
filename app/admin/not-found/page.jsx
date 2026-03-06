"use client"

import Link from "next/link"

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="text-center">

        <h1 className="text-7xl font-bold text-purple-500 mb-4">
          404
        </h1>

        <p className="text-gray-400 mb-6">
          Anda tidak memiliki akses ke halaman ini
        </p>

        <Link
          href="/admin/dashboard"
          className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
        >
          Kembali ke Dashboard
        </Link>

      </div>

    </div>
  )
}