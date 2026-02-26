'use client'

import { useEffect, useState } from "react"
import {
  Copy,
  Search,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { authFetch } from "../../lib/authFetch"

/* ================= ANIMATION ================= */

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
}


/* ================= PAGE ================= */

export default function ReferralPage() {
  const [tab, setTab] = useState("harian")
  const [dashboard, setDashboard] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [attachCode, setAttachCode] = useState("")
  const [attachLoading, setAttachLoading] = useState(false)
  const [attachMessage, setAttachMessage] = useState(null)

  const [previewAmount, setPreviewAmount] = useState(100000)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  /* ================= FETCH DASHBOARD ================= */

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      setLoading(true)

      const res = await authFetch(`/api/v1/referral`)
      console.log("RES:", res)
      const json = res?.data ? res : await res.json()

      if (!json.success) throw new Error(json.message)

      setDashboard(json.data)
      // history dummy sementara (backend belum ada endpoint history)
      setHistory([])
    } catch (err) {
      console.error("Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ================= ATTACH REFERRAL ================= */

  async function handleAttach() {
    if (!attachCode) return

    try {
      setAttachLoading(true)
      setAttachMessage(null)

      const res = await authFetch(`/api/v1/referral/attach`, {
        method: "POST",
        body: JSON.stringify({ code: attachCode }),
      })

      const json = res?.data ? res : await res.json()

      if (!json.success) throw new Error(json.message)

      setAttachMessage({
        type: "success",
        text: json.data.message
      })

      fetchDashboard()
      setAttachCode("")
    } catch (err) {
      setAttachMessage({
        type: "error",
        text: err.message
      })
    } finally {
      setAttachLoading(false)
    }
  }

  /* ================= PREVIEW DISCOUNT ================= */

  async function handlePreview() {
    try {
      setPreviewLoading(true)

      const res = await authFetch(`/api/v1/referral/preview-discount`, {
        method: "POST",
        body: JSON.stringify({ amount: previewAmount }),
      })

      const json = res?.data ? res : await res.json()

      if (!json.success) throw new Error(json.message)

      setPreview(json.data)
    } catch (err) {
      console.error(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  /* ================= COPY ================= */

  function copy(text) {
    navigator.clipboard.writeText(text)
    setAttachMessage({
      type: "success",
      text: "Berhasil disalin!"
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  const referralCode = dashboard?.my_referral_code
  const relation = dashboard?.relation?.referrer

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-8 py-10 text-white"
    >
      <h1 className="text-3xl font-bold mb-8">Referral</h1>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Kode Referral" value={referralCode} />
        <StatCard label="Total Referral" value="—" />
        <StatCard label="Total Omzet" value="—" />
        <StatCard label="Omzet Rate" value="—" />
      </div>

      {/* ================= KODE REFERRAL ================= */}
      <Card>
        <h3 className="font-semibold mb-4">Kode Referral</h3>

        <p className="text-sm text-gray-400 mb-1">Kode Referral Anda</p>
        <div className="flex gap-2 mb-4">
          <input
            readOnly
            value={referralCode || ""}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />
          <button
            onClick={() => copy(referralCode)}
            className="rounded-lg border border-purple-700 px-3 hover:bg-purple-700 transition"
          >
            <Copy size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-1">Link Kode Referral</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={`https://growtechcentral.site?ref=${referralCode}`}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />
          <button
            onClick={() => copy(`https://growtechcentral.site?ref=${referralCode}`)}
            className="rounded-lg border border-purple-700 px-3 hover:bg-purple-700 transition"
          >
            <Copy size={16} />
          </button>
        </div>
      </Card>

      {/* ================= GUNAKAN KODE ================= */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-2">Gunakan Kode Referral</h3>
        <p className="text-sm text-gray-400 mb-4">
          Masukkan kode referral dari teman untuk mendapatkan bonus
        </p>

        <div className="flex gap-2 mb-3">
          <input
            value={attachCode}
            onChange={(e) => setAttachCode(e.target.value)}
            placeholder="Contoh: REF-TEMAN123"
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />
          <button
            onClick={handleAttach}
            disabled={attachLoading}
            className="rounded-lg bg-purple-700 px-4 hover:bg-purple-600 transition disabled:opacity-50"
          >
            {attachLoading ? <Loader2 className="animate-spin" size={16} /> : "Gunakan Kode"}
          </button>
        </div>

        <AnimatePresence>
          {attachMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm flex items-center gap-2 ${
                attachMessage.type === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {attachMessage.type === "success"
                ? <CheckCircle size={16} />
                : <AlertCircle size={16} />}
              {attachMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {relation && (
          <div className="text-sm text-gray-400 mt-3">
            Terhubung dengan: <b>{relation.name}</b> ({relation.email})
          </div>
        )}
      </Card>

      {/* ================= PREVIEW DISCOUNT ================= */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-3">Preview Diskon Referral</h3>

        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={previewAmount}
            onChange={(e) => setPreviewAmount(Number(e.target.value))}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="rounded-lg bg-purple-700 px-4 hover:bg-purple-600 transition"
          >
            {previewLoading ? <Loader2 className="animate-spin" size={16} /> : "Hitung"}
          </button>
        </div>

        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm space-y-1"
          >
            <p>Status: <b className={preview.eligible ? "text-green-400" : "text-red-400"}>
              {preview.eligible ? "Eligible" : "Tidak Eligible"}
            </b></p>
            <p>Diskon: <b>Rp {preview.discount_amount?.toLocaleString()}</b></p>
            <p>Total Bayar: <b>Rp {preview.final_amount?.toLocaleString()}</b></p>
            {preview.reason && <p className="text-red-400">{preview.reason}</p>}
          </motion.div>
        )}
      </Card>

      {/* ================= OMZET ================= */}
      <div className="flex gap-3 mt-10 mb-4">
        <TabButton active={tab === "harian"} onClick={() => setTab("harian")}>
          Omzet Harian
        </TabButton>
        <TabButton active={tab === "bulanan"} onClick={() => setTab("bulanan")}>
          Omzet Bulanan
        </TabButton>
      </div>

      <Card>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          Grafik omzet (API belum tersedia)
        </div>
      </Card>

      {/* ================= HISTORY ================= */}
      <Card className="mt-10">
        <h3 className="font-semibold mb-4">Riwayat Referral</h3>
        <div className="text-sm text-gray-500">
          Endpoint history belum tersedia
        </div>
      </Card>
    </motion.section>
  )
}

/* ================= COMPONENTS ================= */

function Card({ children, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`rounded-2xl border border-purple-700 bg-black p-6 transition ${className}`}
    >
      {children}
    </motion.div>
  )
}

function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-xl border border-purple-700 bg-black p-4"
    >
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-semibold">{value || "—"}</p>
    </motion.div>
  )
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border transition ${
        active
          ? "bg-purple-700 border-purple-700"
          : "border-purple-700 hover:bg-purple-900/40"
      }`}
    >
      {children}
    </button>
  )
}