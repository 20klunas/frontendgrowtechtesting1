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
  Gift,
  ArrowUpRight,
  Sparkles
} from "lucide-react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

import { motion, AnimatePresence } from "framer-motion"
import { authFetch } from "../../lib/authFetch"


/* ================= BACKGROUND ANIMATION ================= */

const backgroundGlow = {
  animate: {
    opacity: [0.3, 0.6, 0.3],
    scale: [1, 1.05, 1],
  },
  transition: {
    duration: 6,
    repeat: Infinity
  }
}

/* ================= PAGE ANIMATION ================= */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: .4 }
  }
}

/* ================= MAIN PAGE ================= */

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

      <div className="flex justify-center items-center h-screen text-purple-400">

        <Loader2 className="animate-spin w-10 h-10" />

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
      className="relative max-w-7xl mx-auto px-4 md:px-8 py-12 text-white"
    >

      {/* Background glow */}

      <motion.div
        variants={backgroundGlow}
        animate="animate"
        className="absolute blur-[120px] bg-purple-700 opacity-30 w-[500px] h-[500px] -top-40 -left-40 rounded-full"
      />

      <motion.div
        variants={backgroundGlow}
        animate="animate"
        className="absolute blur-[120px] bg-fuchsia-700 opacity-30 w-[400px] h-[400px] bottom-0 right-0 rounded-full"
      />

      {/* TITLE */}

      <h1 className="text-3xl md:text-4xl font-bold mb-10 flex items-center gap-2">

        <Sparkles className="text-purple-400"/>
        Referral Dashboard

      </h1>

      {/* ================= ANALYTICS ================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

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
            className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={() => copy(referralCode)}
            className="px-4 border border-purple-700 rounded-xl hover:bg-purple-700/30 transition"
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
            className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handleAttach}
            className="bg-purple-700 px-4 rounded-xl hover:bg-purple-600 transition"
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
            className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handlePreview}
            className="bg-purple-700 px-4 rounded-xl hover:bg-purple-600 transition"
          >

            {previewLoading
              ? <Loader2 className="animate-spin"/>
              : "Check"}

          </button>

        </div>

        {preview && (

          <div className="mt-4 text-sm space-y-1">

            <p>
              Discount:
              <b className="text-green-400">
                Rp {preview.discount_amount?.toLocaleString()}
              </b>
            </p>

            <p>
              Final Price:
              <b className="text-purple-400">
                Rp {preview.final_amount?.toLocaleString()}
              </b>
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
            className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700 px-4 py-2"
          />

          <button
            onClick={handleWithdraw}
            className="bg-purple-700 px-4 rounded-xl hover:bg-purple-600 transition"
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

        <div className="h-[320px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" stroke="#6b21a8"/>

              <XAxis dataKey="date"/>

              <YAxis/>

              <Tooltip/>

              <Line
                type="monotone"
                dataKey="amount"
                stroke="#9333ea"
                strokeWidth={3}
                dot={false}
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

        <div className="space-y-3">

          {withdrawHistory.map(w => (

            <motion.div
              key={w.id}
              whileHover={{ scale:1.02 }}
              className="flex justify-between border border-purple-700 rounded-xl p-4 bg-purple-900/20"
            >

              <span className="font-semibold">
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

            </motion.div>

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
      className={`rounded-2xl border border-purple-700 bg-black/70 backdrop-blur p-6 ${className}`}
    >

      {children}

    </motion.div>

  )

}


function StatCard({ icon, label, value }) {

  return (

    <motion.div
      whileHover={{ scale:1.05 }}
      className="border border-purple-700 rounded-xl p-4 bg-black/60 backdrop-blur"
    >

      <div className="flex items-center gap-2 mb-2 text-purple-400">
        {icon}
      </div>

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="font-semibold text-lg">
        {value}
      </p>

    </motion.div>

  )

}