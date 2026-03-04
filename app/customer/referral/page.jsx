'use client'

import { useEffect, useState, useMemo } from "react"
import {
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wallet,
  Users,
  TrendingUp,
  Gift
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

  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [withdrawLoadingHistory, setWithdrawLoadingHistory] = useState(false)

  const [attachCode, setAttachCode] = useState("")
  const [attachLoading, setAttachLoading] = useState(false)
  const [attachMessage, setAttachMessage] = useState(null)

  const [previewAmount, setPreviewAmount] = useState(100000)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawMessage, setWithdrawMessage] = useState(null)

  /* ================= INIT ================= */

  useEffect(() => {

    fetchDashboard()
    fetchWithdrawHistory()

  }, [])

  /* ================= FETCH DASHBOARD ================= */

  async function fetchDashboard() {

    try {

      setLoading(true)

      const json = await authFetch(`/api/v1/referral`)
      setDashboard(json.data)

    } catch (err) {

      console.error(err)

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

      console.error(err)

    } finally {

      setWithdrawLoadingHistory(false)

    }

  }

  /* ================= ANALYTICS ================= */

  const analytics = useMemo(() => {

    const total = withdrawHistory.reduce(
      (sum, w) => sum + Number(w.amount),
      0
    )

    const approved = withdrawHistory
      .filter(w => w.status === "approved")
      .reduce((sum, w) => sum + Number(w.amount), 0)

    const pending = withdrawHistory
      .filter(w => w.status === "pending")
      .reduce((sum, w) => sum + Number(w.amount), 0)

    return {
      total,
      approved,
      pending,
      withdrawCount: withdrawHistory.length
    }

  }, [withdrawHistory])

  /* ================= CHART DATA ================= */

  const chartData = withdrawHistory.map(w => ({
    date: new Date(w.created_at).toLocaleDateString(),
    amount: Number(w.amount)
  }))

  /* ================= ATTACH REFERRAL ================= */

  async function handleAttach() {

    if (!attachCode) return

    try {

      setAttachLoading(true)

      const json = await authFetch(`/api/v1/referral/attach`, {
        method: "POST",
        body: JSON.stringify({
          code: attachCode
        }),
      })

      setAttachMessage({
        type: "success",
        text: json.message
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

  /* ================= PREVIEW ================= */

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

      console.error(err)

    } finally {

      setPreviewLoading(false)

    }

  }

  /* ================= WITHDRAW ================= */

  async function handleWithdraw() {

    if (!withdrawAmount) return

    try {

      setWithdrawLoading(true)

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

    navigator.clipboard.writeText(text)

    setAttachMessage({
      type: "success",
      text: "Copied!"
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
      className="max-w-7xl mx-auto px-4 md:px-8 py-10 text-white"
    >

      <h1 className="text-2xl md:text-3xl font-bold mb-8">
        Referral Dashboard
      </h1>

      {/* ================= ANALYTICS ================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <StatCard
          icon={<Gift size={20}/>}
          label="Total Earnings"
          value={`Rp ${analytics.total.toLocaleString()}`}
        />

        <StatCard
          icon={<Wallet size={20}/>}
          label="Withdraw Approved"
          value={`Rp ${analytics.approved.toLocaleString()}`}
        />

        <StatCard
          icon={<AlertCircle size={20}/>}
          label="Pending Withdraw"
          value={`Rp ${analytics.pending.toLocaleString()}`}
        />

        <StatCard
          icon={<Users size={20}/>}
          label="Withdraw Count"
          value={analytics.withdrawCount}
        />

      </div>

      {/* ================= REFERRAL CODE ================= */}

      <Card>

        <h3 className="font-semibold mb-3">
          Your Referral Code
        </h3>

        <div className="flex gap-2">

          <input
            readOnly
            value={referralCode || ""}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={() => copy(referralCode)}
            className="px-3 border border-purple-700 rounded-lg"
          >
            <Copy size={16}/>
          </button>

        </div>

      </Card>

      {/* ================= ATTACH ================= */}

      <Card className="mt-6">

        <h3 className="font-semibold mb-3">
          Use Referral Code
        </h3>

        <div className="flex gap-2">

          <input
            value={attachCode}
            onChange={(e)=>setAttachCode(e.target.value)}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handleAttach}
            className="bg-purple-700 px-4 rounded-lg"
          >
            {attachLoading
              ? <Loader2 className="animate-spin"/>
              : "Attach"}
          </button>

        </div>

        {relation && (
          <p className="text-sm text-gray-400 mt-2">
            Referrer: {relation.name}
          </p>
        )}

      </Card>

      {/* ================= PREVIEW ================= */}

      <Card className="mt-6">

        <h3 className="font-semibold mb-3">
          Preview Discount
        </h3>

        <div className="flex gap-2">

          <input
            type="number"
            value={previewAmount}
            onChange={(e)=>setPreviewAmount(Number(e.target.value))}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handlePreview}
            className="bg-purple-700 px-4 rounded-lg"
          >
            {previewLoading
              ? <Loader2 className="animate-spin"/>
              : "Check"}
          </button>

        </div>

        {preview && (
          <div className="mt-3 text-sm">

            <p>
              Discount:
              <b> Rp {preview.discount_amount?.toLocaleString()}</b>
            </p>

            <p>
              Final Price:
              <b> Rp {preview.final_amount?.toLocaleString()}</b>
            </p>

          </div>
        )}

      </Card>

      {/* ================= WITHDRAW ================= */}

      <Card className="mt-6">

        <h3 className="font-semibold mb-3">
          Withdraw Commission
        </h3>

        <div className="flex gap-2">

          <input
            type="number"
            value={withdrawAmount}
            onChange={(e)=>setWithdrawAmount(e.target.value)}
            className="flex-1 rounded-lg bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handleWithdraw}
            className="bg-purple-700 px-4 rounded-lg"
          >
            {withdrawLoading
              ? <Loader2 className="animate-spin"/>
              : "Withdraw"}
          </button>

        </div>

      </Card>

      {/* ================= CHART ================= */}

      <Card className="mt-10">

        <h3 className="font-semibold mb-4">
          Earnings Chart
        </h3>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={chartData}>

              <XAxis dataKey="date"/>

              <YAxis/>

              <Tooltip/>

              <Line
                type="monotone"
                dataKey="amount"
                stroke="#9333ea"
                strokeWidth={2}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </Card>

      {/* ================= HISTORY ================= */}

      <Card className="mt-10">

        <h3 className="font-semibold mb-4">
          Withdraw History
        </h3>

        <div className="space-y-2">

          {withdrawHistory.map(w => (

            <div
              key={w.id}
              className="flex justify-between border border-purple-700 rounded-lg p-3"
            >

              <span>
                Rp {Number(w.amount).toLocaleString()}
              </span>

              <span className={
                w.status === "approved"
                  ? "text-green-400"
                  : w.status === "rejected"
                  ? "text-red-400"
                  : "text-yellow-400"
              }>
                {w.status}
              </span>

            </div>

          ))}

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

function StatCard({ icon, label, value }) {

  return (

    <div className="border border-purple-700 rounded-xl p-4 bg-black">

      <div className="flex items-center gap-2 mb-2 text-purple-400">
        {icon}
      </div>

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="font-semibold">
        {value}
      </p>

    </div>

  )

}