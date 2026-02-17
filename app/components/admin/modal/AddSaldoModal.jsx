"use client"
import { useState } from "react"
import Modal from "./Modal"
import { apiFetch } from "../../../../app/lib/utils"

export default function AddSaldoModal({ open, onClose, user, onSuccess }) {
  const [tambah, setTambah] = useState("")
  const [loading, setLoading] = useState(false)

  const total = Number(user?.saldo || 0) + Number(tambah || 0)

  async function handleSubmit() {
    if (!tambah || Number(tambah) <= 0) {
      return alert("Masukkan nominal saldo yang valid")
    }

    try {
      setLoading(true)

      await apiFetch("/api/v1/admin/wallet/topup", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          amount: Number(tambah),
          note: "Topup oleh admin"
        }),
      })

      onSuccess?.()
      onClose()

    } catch (err) {
      console.error("TOPUP ERROR:", err)
      alert("Gagal menambahkan saldo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Saldo">
      <p className="text-gray-400 mb-4">
        Tambahkan saldo untuk <b>{user?.email}</b>
      </p>

      <div className="space-y-3">
        <input
          disabled
          value={user?.saldo ?? 0}
          className="w-full bg-purple-900/40 text-white p-2 rounded"
        />

        <input
          type="number"
          placeholder="Masukkan jumlah saldo"
          className="w-full bg-purple-900/40 text-white p-2 rounded"
          value={tambah}
          onChange={(e) => setTambah(e.target.value)}
        />

        <div className="bg-green-600 text-black p-2 rounded font-semibold">
          Rp {total.toLocaleString()}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="bg-white px-4 py-1 rounded text-black"
        >
          Batal
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          {loading ? "Menambahkan..." : "Tambah"}
        </button>
      </div>
    </Modal>
  )
}
