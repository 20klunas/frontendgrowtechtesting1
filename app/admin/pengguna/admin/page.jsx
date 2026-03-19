'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from 'framer-motion'

import AnimatedSection from "../../../components/ui/AnimatedSection"
import Pagination from "../../../components/admin/Pagination"
import ConfirmDeleteModal from "../../../../app/components/admin/modal/ConfirmDeleteModal"
import PermissionGate from "../../../components/admin/PermissionGate"

import { apiFetch } from "../../../lib/utils"

import {
  Plus,
  Pencil,
  Trash2,
  Search
} from "lucide-react"

export default function ManajemenAdminPage() {
  const router = useRouter()

  const [modal, setModal] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const limit = 8

  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState("")
  const [filteredData, setFilteredData] = useState([])

  const [meta, setMeta] = useState({
    total: 0,
    per_page: limit,
    current_page: page,
  })

  useEffect(() => {
    fetchData()
  }, [page])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(data)
      return
    }

    const keyword = search.toLowerCase()

    const result = data.filter(user =>
      user.name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.full_name?.toLowerCase().includes(keyword)
    )

    setFilteredData(result)
  }, [search, data])

  async function fetchData() {
    try {
      setLoading(true)

      const res = await apiFetch(
        `/api/v1/admin/users?page=${page}&limit=${limit}`
      )

      const users = res?.data?.data || []

      const filtered = users.filter(user => user.role === "admin")

      setData(filtered)
      setFilteredData(filtered)

      setMeta({
        total: res.data.total,
        per_page: res.data.per_page,
        current_page: res.data.current_page,
      })

    } catch (err) {
        console.error("GET ADMIN ERROR:", {
            message: err?.message,
            status: err?.status,
            full: err
        })

        alert(err?.message || "Gagal mengambil data admin")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await apiFetch(`/api/v1/admin/users/${selectedId}`, {
        method: "DELETE",
      })

      setModal(null)
      setSelectedId(null)
      fetchData()
    } catch (err) {
      alert("Gagal menghapus admin")
    }
  }

  return (
    <PermissionGate permission="manage_users">
      <div className="px-4 md:px-6 py-8 text-white max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Manajemen Admin
          </h1>

          <button
            onClick={() => router.push("/admin/pengguna/tambah-admin")}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl 
              bg-gradient-to-r from-green-400 to-emerald-500 
              text-black font-semibold shadow-lg hover:scale-105 transition"
          >
            <Plus size={16} /> Tambah Admin
          </button>
        </div>

        <AnimatedSection>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-purple-500/30 
              bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] 
              backdrop-blur-xl p-4 md:p-6 shadow-xl"
          >

            {/* SEARCH */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={16} />
              <input
                placeholder="Cari admin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl 
                  bg-purple-900/30 border border-purple-700/40
                  focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* LOADING */}
            {loading && (
              <div className="text-center py-10 text-purple-300 animate-pulse">
                Memuat data...
              </div>
            )}

            {/* EMPTY */}
            {!loading && filteredData.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                Tidak ada data admin
              </div>
            )}

            {/* DATA */}
            {!loading && filteredData.length > 0 && (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-purple-700/50 text-purple-300">
                      <tr>
                        <th className="py-3">Username</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(row => (
                        <tr key={row.id} className="border-b border-purple-900/40 hover:bg-purple-900/20 transition">
                          <td className="py-3 text-center">{row.name ?? "-"}</td>
                          <td className="text-center">{row.email ?? "-"}</td>
                          <td className="text-center">{row.full_name ?? "-"}</td>
                          <td className="text-center space-x-2">
                            <button
                              onClick={() => router.push(`/admin/pengguna/edit-admin/${row.id}`)}
                              className="bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1 rounded-lg transition"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedId(row.id)
                                setModal("delete")
                              }}
                              className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD */}
                <div className="md:hidden space-y-4">
                  {filteredData.map(row => (
                    <div key={row.id}
                      className="p-4 rounded-xl bg-purple-900/20 border border-purple-700/40 space-y-2">

                      <div><b>Username:</b> {row.name ?? "-"}</div>
                      <div><b>Email:</b> {row.email ?? "-"}</div>
                      <div><b>Nama:</b> {row.full_name ?? "-"}</div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => router.push(`/admin/pengguna/edit-admin/${row.id}`)}
                          className="flex-1 bg-yellow-400 text-black py-2 rounded-lg"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setSelectedId(row.id)
                            setModal("delete")
                          }}
                          className="flex-1 bg-red-600 py-2 rounded-lg"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PAGINATION */}
                <div className="mt-6">
                  <Pagination
                    page={meta.current_page}
                    total={meta.total}
                    limit={meta.per_page}
                    onChange={setPage}
                  />
                </div>
              </>
            )}

          </motion.div>
        </AnimatedSection>

        <ConfirmDeleteModal
          open={modal === "delete"}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      </div>
    </PermissionGate>
  )
}