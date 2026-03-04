'use client'

import { useEffect, useState } from "react"
import {
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wallet
} from "lucide-react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
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

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  const [attachCode, setAttachCode] = useState("")
  const [attachLoading, setAttachLoading] = useState(false)
  const [attachMessage, setAttachMessage] = useState(null)

  const [previewAmount, setPreviewAmount] = useState(100000)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawMessage, setWithdrawMessage] = useState(null)

  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [withdrawLoadingHistory, setWithdrawLoadingHistory] = useState(false)

  const [mounted, setMounted] = useState(false)

  /* ================= INIT ================= */

  useEffect(() => {
    fetchDashboard()
    fetchWithdrawHistory()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  /* ================= FETCH DASHBOARD ================= */

  async function fetchDashboard() {
    try {
      setLoading(true)

      const json = await authFetch(`/api/v1/referral`)

      setDashboard(json.data)

    } catch (err) {
      console.error("Dashboard error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ================= FETCH WITHDRAW ================= */

  async function fetchWithdrawHistory() {
    try {

      setWithdrawLoadingHistory(true)

      const json = await authFetch(`/api/v1/withdraws`)

      setWithdrawHistory(json.data?.data || [])

    } catch (err) {
      console.error("Withdraw history error:", err.message)
    } finally {
      setWithdrawLoadingHistory(false)
    }
  }

  /* ================= ATTACH REFERRAL ================= */

  async function handleAttach() {

    if (!attachCode) return

    try {

      setAttachLoading(true)
      setAttachMessage(null)

      const json = await authFetch(`/api/v1/referral/attach`, {
        method: "POST",
        body: JSON.stringify({
          code: attachCode
        }),
      })

      setAttachMessage({
        type: "success",
        text: json.message || "Referral berhasil dipasang"
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

      const json = await authFetch(`/api/v1/referral/preview-discount`, {
        method: "POST",
        body: JSON.stringify({
          amount: previewAmount
        }),
      })

      setPreview(json.data)

    } catch (err) {

      console.error("Preview error:", err.message)

    } finally {
      setPreviewLoading(false)
    }
  }

  /* ================= WITHDRAW ================= */

  async function handleWithdraw() {

    if (!withdrawAmount) return

    try {

      setWithdrawLoading(true)
      setWithdrawMessage(null)

      const json = await authFetch(`/api/v1/withdraws`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(withdrawAmount)
        }),
      })

      setWithdrawMessage({
        type: "success",
        text: json.message
      })

      setWithdrawAmount("")
      fetchWithdrawHistory()

    } catch (err) {

      setWithdrawMessage({
        type: "error",
        text: err.message
      })

    } finally {
      setWithdrawLoading(false)
    }
  }

  /* ================= COPY ================= */

  function copy(text) {

    if (!text) return

    navigator.clipboard.writeText(text)

    setAttachMessage({
      type: "success",
      text: "Berhasil disalin!"
    })
  }

  /* ================= LOADING ================= */

  if (loading) {

    return (
      <div className="flex justify-center items-center h-screen text-white">
        <Loader2 className="animate-spin" />
      </div>
    )

  }

  const referralCode = dashboard?.my_referral_code
  const relation = dashboard?.relation?.referrer

  /* ================= UI ================= */

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-8 py-10 text-white"
    >

      <h1 className="text-3xl font-bold mb-8">Referral</h1>

      {/* ================= REFERRAL CODE ================= */}

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

        <p className="text-sm text-gray-400 mb-1">Link Referral</p>

        <input
          readOnly
          value={`https://growtechcentral.site?ref=${referralCode}`}
          className="w-full rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
        />

      </Card>

      {/* ================= ATTACH CODE ================= */}

      <Card className="mt-6">

        <h3 className="font-semibold mb-3">Gunakan Kode Referral</h3>

        <div className="flex gap-2 mb-3">

          <input
            value={attachCode}
            onChange={(e) => setAttachCode(e.target.value)}
            placeholder="Masukkan kode referral"
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handleAttach}
            disabled={attachLoading}
            className="rounded-lg bg-purple-700 px-4 hover:bg-purple-600"
          >
            {attachLoading
              ? <Loader2 className="animate-spin" size={16} />
              : "Gunakan"
            }
          </button>

        </div>

        <AnimatePresence>

          {attachMessage && (

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm flex gap-2 ${
                attachMessage.type === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >

              {attachMessage.type === "success"
                ? <CheckCircle size={16} />
                : <AlertCircle size={16} />
              }

              {attachMessage.text}

            </motion.div>

          )}

        </AnimatePresence>

        {relation && (

          <p className="text-sm text-gray-400 mt-2">
            Terhubung dengan: <b>{relation.name}</b>
          </p>

        )}

      </Card>

      {/* ================= PREVIEW DISCOUNT ================= */}

      <Card className="mt-6">

        <h3 className="font-semibold mb-3">Preview Diskon</h3>

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
            className="rounded-lg bg-purple-700 px-4"
          >

            {previewLoading
              ? <Loader2 className="animate-spin" size={16} />
              : "Hitung"
            }

          </button>

        </div>

        {preview && (

          <div className="text-sm space-y-1">

            <p>
              Status:
              <b className={preview.eligible ? "text-green-400" : "text-red-400"}>
                {preview.eligible ? " Eligible" : " Tidak Eligible"}
              </b>
            </p>

            <p>
              Diskon:
              <b> Rp {preview.discount_amount?.toLocaleString()}</b>
            </p>

            <p>
              Total Bayar:
              <b> Rp {preview.final_amount?.toLocaleString()}</b>
            </p>

            {preview.reason &&
              <p className="text-red-400">{preview.reason}</p>
            }

          </div>

        )}

      </Card>

      {/* ================= WITHDRAW ================= */}

      <Card className="mt-10">

        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Wallet size={18}/> Withdraw Komisi
        </h3>

        <div className="flex gap-2 mb-3">

          <input
            type="number"
            value={withdrawAmount}
            onChange={(e)=>setWithdrawAmount(e.target.value)}
            placeholder="Nominal withdraw"
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handleWithdraw}
            disabled={withdrawLoading}
            className="rounded-lg bg-purple-700 px-4"
          >

            {withdrawLoading
              ? <Loader2 className="animate-spin" size={16}/>
              : "Withdraw"
            }

          </button>

        </div>

        {withdrawMessage && (

          <p className={`text-sm ${
            withdrawMessage.type === "success"
              ? "text-green-400"
              : "text-red-400"
          }`}>
            {withdrawMessage.text}
          </p>

        )}

      </Card>

      {/* ================= HISTORY ================= */}

      <Card className="mt-10">

        <h3 className="font-semibold mb-4">Riwayat Withdraw</h3>

        {withdrawLoadingHistory && (
          <Loader2 className="animate-spin"/>
        )}

        <div className="space-y-2 text-sm">

          {withdrawHistory.map((item)=>(
            <div
              key={item.id}
              className="border border-purple-700 rounded-lg p-3 flex justify-between"
            >
              <span>
                Rp {Number(item.amount).toLocaleString()}
              </span>

              <span className={
                item.status === "approved"
                  ? "text-green-400"
                  : item.status === "rejected"
                  ? "text-red-400"
                  : "text-yellow-400"
              }>
                {item.status}
              </span>
            </div>
          ))}

          {!withdrawHistory.length && (
            <p className="text-gray-500">Belum ada withdraw</p>
          )}

        </div>

      </Card>

    </motion.section>
  )
}

/* ================= COMPONENT ================= */

function Card({ children, className="" }) {

  return (
    <motion.div
      whileHover={{ scale:1.01 }}
      className={`rounded-2xl border border-purple-700 bg-black p-6 ${className}`}
    >
      {children}
    </motion.div>
  )

}