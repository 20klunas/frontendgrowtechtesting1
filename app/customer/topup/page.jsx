'use client'

import { useState } from "react"
import { X, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import Cookies from "js-cookie"
import Script from 'next/script'

/* ================= DATA ================= */

const PRESETS = [
  { label: "Rp 10K", value: 10000 },
  { label: "Rp 25K", value: 25000 },
  { label: "Rp 50K", value: 50000 },
  { label: "Rp 100K", value: 100000 },
  { label: "Rp 150K", value: 150000 },
  { label: "Rp 300K", value: 300000 },
]

const PAYMENT_METHODS = [
  {
    id: "midtrans",
    name: "QRIS Midtrans",
    desc: "Scan QR Code Untuk Pembayaran Instant",
    fee: 35,
    prefix: "MID",
  },
  {
    id: "duitku",
    name: "QRIS Duitku",
    desc: "Scan QR Code Untuk Pembayaran Instant",
    fee: 50,
    prefix: "DKU",
  },
]

/* ================= PAGE ================= */

export default function TopUpPage() {
  const router = useRouter()

  const [amount, setAmount] = useState(10000)
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [wallet, setWallet] = useState(null)
  const [history, setHistory] = useState([])
  const [token, setToken] = useState(null)

  useEffect(() => {
    setToken(Cookies.get("token"))
  }, [])



  const API = process.env.NEXT_PUBLIC_API_URL

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  })

  const handleTopup = async () => {
    if (!token) {
      alert("Silakan login ulang")
      router.push("/login")
      return
    }

    if (!window.snap) {
      alert("Midtrans belum siap, refresh halaman")
      return
    }

    try {
      const res = await fetch(`${API}/api/v1/wallet/topups/init`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
      })

      const data = await res.json()
      if (!data.success) throw new Error("Topup init gagal")

      window.snap.pay(data.data.snap_token, {
        onSuccess: async function() {
          await fetchWalletSummary()
          setShowSuccess(true)
        },
        onPending: function() {
          alert("Menunggu pembayaran")
        },
        onError: function() {
          alert("Pembayaran gagal")
        },
        onClose: function() {
          console.log("User menutup popup")
        }
      })

    } catch (err) {
      console.error("TOPUP ERROR:", err)
      alert("Topup gagal")
    }
  }



  const fetchWalletSummary = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API}/api/v1/wallet/summary`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setWallet(data.data.wallet)
        setHistory(data.data.last_entries || [])
      }

    } catch (err) {
      console.error("Wallet fetch error:", err)
    }
  }

  useEffect(() => {
    if (token) fetchWalletSummary()
  }, [token])


  const fee = paymentMethod.fee
  const total = amount + fee

  // const saldoAwal = 500000
  // const saldoBaru = saldoAwal + amount

  // const invoiceId = `${paymentMethod.prefix}-20241220-001`

  return (
    <>
    <Script
      src="https://app.sandbox.midtrans.com/snap/snap.js"
      data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      strategy="afterInteractive"
    />
    <section className="max-w-7xl mx-auto px-8 py-10 text-white">

      <h1 className="text-3xl font-bold mb-10">
        Top Up Saldo Wallet
      </h1>

      {/* ================= TOP ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

        {/* LEFT */}
        <div className="space-y-6">

          <Card>
            <Header title="Saldo Wallet Anda" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 24 24"><g fill="none" stroke="#9333ea" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M17 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6"/><path d="M20 12v4h-4a2 2 0 0 1 0-4z"/></g></svg>
            } />
            <p className="text-sm text-gray-400">Total Saldo</p>
            <p className="text-3xl font-bold mt-2 mb-2">
              Rp {wallet?.balance?.toLocaleString?.('id-ID') ?? 0}
            </p>
            <p className="text-sm text-red-500">
              ⚠️ Topup untuk melakukan pembelian lebih banyak
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Pilih Jumlah Top Up</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setAmount(p.value)}
                  className={`rounded-xl border py-3 transition
                    ${amount === p.value
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-purple-700 hover:bg-purple-700/10"}
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-400 mb-2">
              Atau Masukkan Jumlah Custom
            </p>

            <div className="flex border border-purple-700 rounded-xl overflow-hidden">
              <span className="px-4 text-gray-400">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value || 0))}
                className="flex-1 bg-black px-4 py-3 outline-none"
              />
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          <Card>
            <h3 className="font-semibold mb-4">Ringkasan Top Up</h3>

            <div className="space-y-2 text-sm">
              <Row label="Jumlah Top Up" value={`Rp ${amount.toLocaleString()}`} />
              <Row label="Fee Admin" value={`Rp ${fee}`} />
            </div>

            <div className="border-t border-purple-700 mt-4 pt-4 flex justify-between font-semibold">
              <span>Ringkasan Top Up</span>
              <span>Rp {total.toLocaleString()}</span>
            </div>

            <button
              // onClick={() => setShowConfirm(true)}
              onClick={handleTopup}
              className="mt-6 w-full rounded-xl border border-purple-500 py-3 font-semibold hover:bg-purple-500/10"
            >
              Lanjutkan Pembayaran
            </button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Metode Pembayaran</h3>

            <div className="space-y-4">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m)}
                  className={`w-full flex items-center gap-4 rounded-xl border p-4 transition
                    ${paymentMethod.id === m.id
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-purple-700 hover:bg-purple-700/10"}
                  `}
                >
                  <span className="text-2xl">➜</span>
                  <div className="text-left">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-gray-400">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ================= HISTORY ================= */}
      <Card>
        <h3 className="font-semibold mb-6">Riwayat Top Up</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-purple-700 text-gray-400">
              <tr>
                <th className="py-3 text-left">No</th>
                <th className="text-left">Jumlah</th>
                <th className="text-left">Metode</th>
                <th className="text-left">Tanggal & Jam</th>
                <th className="text-left">Status</th>
                <th className="text-left">ID</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={row.id} className="border-b border-purple-800/40">
                  <td className="py-3">{i + 1}</td>
                  <td>Rp {Number(row.amount || 0).toLocaleString('id-ID')}</td>
                  <td>{row.type}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-'}</td>
                  <td className={row.direction === "CREDIT" ? "text-green-400" : "text-red-400"}>
                    {row.direction}
                  </td>
                  <td className="text-purple-400">{row.tx_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= MODAL KONFIRMASI ================= */}
      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)}>
          <h3 className="text-lg font-bold mb-4">Konfirmasi Top Up</h3>

          <div className="space-y-2 text-sm mb-6">
            <Row label="Jumlah Top Up" value={`Rp ${amount.toLocaleString()}`} />
            <Row label="Metode Pembayaran" value={paymentMethod.name} />
            <Row label="Fee Admin" value={`Rp ${fee}`} />
            <Row label="Total Diterima" value={`Rp ${total.toLocaleString()}`} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 border border-purple-700 rounded-lg py-2"
            >
              Batal
            </button>
            <button
              onClick={() => {
                setShowConfirm(false)
                setShowSuccess(true)
              }}
              className="flex-1 bg-purple-700 rounded-lg py-2 font-semibold"
            >
              Lanjutkan Pembayaran
            </button>
          </div>
        </Modal>
      )}

      {/* ================= SUCCESS ================= */}
      {showSuccess && (
        <Modal onClose={() => setShowSuccess(false)}>
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-green-400 mb-2">
              Top Up Berhasil!
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Saldo Anda berhasil diperbarui
            </p>

            <p className="text-sm text-gray-400">Saldo Terbaru</p>
            <p className="text-2xl font-bold mb-6">
              Rp {wallet?.balance?.toLocaleString?.('id-ID') ?? 0}
            </p>

            <button
              onClick={() => router.push(`/customer/category`)}
              className="w-full bg-purple-700 rounded-xl py-3 font-semibold"
            >
              Mulai Berbelanja
            </button>
          </div>
        </Modal>
      )}
    </section>
    </>
  )
  
}

/* ================= COMPONENTS ================= */

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-purple-700 bg-black p-6">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400">
          <X />
        </button>
        {children}
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="border border-purple-700 rounded-2xl p-6 bg-black">
      {children}
    </div>
  )
}

function Header({ title, icon }) {
  return (
    <div className="flex justify-between mb-4">
      <h3 className="font-semibold">{title}</h3>
      <span>{icon}</span>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-gray-300">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}