'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from 'framer-motion'

import AnimatedSection from "../../components/ui/AnimatedSection"
import Pagination from "../../components/admin/Pagination"
import AddSaldoModal from "../../../app/components/admin/modal/AddSaldoModal"
import ConfirmDeleteModal from "../../../app/components/admin/modal/ConfirmDeleteModal"

import { apiFetch } from "../../lib/utils"
// import { logAudit } from "../../lib/audit"

import {
  Filter,
  Plus,
  Pencil,
  Trash2,
  Wallet
} from "lucide-react"

export default function ManajemenPenggunaPage() {
  const router = useRouter()

  const [tab, setTab] = useState("user")
  const [modal, setModal] = useState(null)

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const limit = 8

  const [selectedId, setSelectedId] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)

  const [search, setSearch] = useState("")
  const [filteredData, setFilteredData] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [roleFilter, setRoleFilter] = useState("all")

  const [meta, setMeta] = useState({
    total: 0,
    per_page: limit,
    current_page: page,
  })

  useEffect(() => {
    fetchData()
  }, [tab, page])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(data)
      return
    }

    const keyword = search.toLowerCase()

    const result = data.filter(user =>
      user.name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.full_name?.toLowerCase().includes(keyword) ||
      user.address?.toLowerCase().includes(keyword)
    )

    setFilteredData(result)

  }, [search, data])

  async function fetchData() {
    try {
      setLoading(true)

      const res = await apiFetch(
        `/api/v1/admin/users?page=${page}&limit=${limit}`,
        { method: "GET" }
      )

      console.log("FINAL RESPONSE:", res)


      const users = Array.isArray(res?.data?.data)
        ? res.data.data
        : []

      const filteredUsers = users.filter(user =>
        tab === "admin"
          ? user.role === "admin"
          : user.role === "user"
      )

      setData(filteredUsers)
      setFilteredData(filteredUsers)


      //  PAGINATION
      setMeta({
        total: res.data.total,
        per_page: res.data.per_page,
        current_page: res.data.current_page,
      })
      console.log("USERS ARRAY:", res.data.data)

    } catch (err) {
      console.error("GET USERS ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit() {
    if (!selectedId) return alert("Pilih data terlebih dahulu")

    router.push(
      tab === "user"
        ? `/admin/pengguna/edit-user/${selectedId}`
        : `/admin/pengguna/edit-admin/${selectedId}`
    )
  }

  function handleAdd() {
    router.push(
      tab === "user"
        ? "/admin/pengguna/tambah-user"
        : "/admin/pengguna/tambah-admin"
    )
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
      alert("Gagal menghapus data")
    }
  }

  return (
    <div className="px-4 md:px-6 py-8 text-white">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">
        {tab === "user" ? "Manajemen User" : "Manajemen Admin"}
      </h1>

      {/* TAB SWITCH */}
      <div className="flex gap-2 mb-6">
        {["user", "admin"].map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setSelectedId(null)
            }}
            className={`px-6 py-2 rounded-lg border transition
              ${tab === t
                ? "bg-purple-700 border-purple-500"
                : "border-purple-700 text-gray-400 hover:bg-purple-700/20"}
            `}
          >
            {t === "user" ? "User" : "Admin"}
          </button>
        ))}
      </div>

      <AnimatedSection keyValue={tab}>
        <motion.div
          className="
            rounded-2xl
            border border-purple-600/60
            bg-black
            p-6
            shadow-[0_0_25px_rgba(168,85,247,0.15)]
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-700 hover:bg-purple-700/20"
            >
              <Filter size={16} />
              Filter
            </button>

            <input
              placeholder="Cari data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg bg-purple-900/40 px-4 py-2 outline-none border border-purple-700"
            />

            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-black font-semibold"
            >
              <Plus size={16} /> Tambah
            </button>

            {/* <button
              onClick={handleEdit}
              disabled={!selectedId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-50"
            >
              <Pencil size={16} /> Edit
            </button>

            <button
              onClick={() => selectedId && setModal("delete")}
              disabled={!selectedId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 font-semibold disabled:opacity-50"
            >
              <Trash2 size={16} /> Hapus
            </button> */}
          </div>

          {/* =========================
             DESKTOP TABLE
          ========================= */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="border-b border-purple-700 text-gray-300">
                <tr>
                  <th className="py-3 text-center">Username</th>
                  <th className="py-3 text-center">Email</th>
                  <th className="py-3 text-center">Nama Lengkap</th>
                  <th className="py-3 text-center">Alamat</th>
                  <th className="py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setSelectedId(row.id)
                      setSelectedRow(row)
                    }}
                    className={`border-b cursor-pointer
                      ${selectedId === row.id
                        ? "bg-purple-700/20"
                        : "border-purple-800/40"}
                    `}
                  >
                    <td className="py-3 font-medium text-center">{row.name}</td>
                    <td className="text-center">{row.email}</td>
                    <td className="text-center">{row.full_name ?? "-"}</td>
                    <td className="text-center">{row.address ?? "-"}</td>

                    <td className="text-right space-x-2">
                      {/* <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRow(row)
                          setModal("saldo")
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18 }}
                        className="btn-purple-solid inline-flex items-center gap-2 px-4 py-2 rounded-lg "
                      >
                        <Wallet size={16} />
                        Add Saldo
                      </motion.button> */}
                      {/* EDIT */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            row.role === "admin"
                              ? `/admin/pengguna/edit-admin/${row.id}`
                              : `/admin/pengguna/edit-user/${row.id}`
                          )
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(row.id)
                          setModal("delete")
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>


            </table>
          </div>

          {/* =========================
             MOBILE CARD
          ========================= */}
          <div className="md:hidden space-y-4">
            {filteredData.map(row => (
              <div
                key={row.id}
                onClick={() => {
                  setSelectedId(row.id)
                  setSelectedRow(row)
                }}
                className={`border rounded-xl p-4 cursor-pointer
                  ${selectedId === row.id
                    ? "border-purple-500 bg-purple-700/20"
                    : "border-purple-700"}
                `}
              >
                <p className="font-semibold">{row.full_name ?? row.name}</p>
                <p className="text-sm text-gray-400">{row.email}</p>
                <p className="text-sm text-gray-500">{row.address ?? "-"}</p>

                {/* <button
                  onClick={() => setModal("saldo")}
                  className="mt-3 w-full bg-purple-700 rounded-lg py-2"
                >
                  Add Saldo
                </button> */}
              </div>
            ))}
          </div>


          {/* PAGINATION */}
          <Pagination
            page={meta.current_page}
            total={meta.total}
            limit={meta.per_page}
            onChange={setPage}
          />
        </motion.div>
      </AnimatedSection>

      {/* =========================
         MODALS
      ========================= */}
      <AddSaldoModal
        open={modal === "saldo"}
        user={selectedRow}
        onClose={() => setModal(null)}
        onSuccess={fetchData}
      />

      <ConfirmDeleteModal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
