"use client"

import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center">

        <h1 className="text-7xl font-bold text-purple-500 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-semibold mb-2">
          Halaman tidak ditemukan
        </h2>

        <p className="text-gray-400 mb-8">
          Anda tidak memiliki akses ke halaman ini atau halaman tidak tersedia.
        </p>

        <Link
          href="/admin/dashboard"
          className="
            px-6 py-3
            rounded-xl
            bg-gradient-to-r
            from-purple-600
            to-purple-500
            hover:from-purple-500
            hover:to-purple-400
            transition
          "
        >
          Kembali ke Dashboard
        </Link>

      </div>
    </div>
  )
}