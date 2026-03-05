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
  Sparkles,
  Share2,
  Crown,
  Clock,
  Network,
} from "lucide-react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts"

import { motion, AnimatePresence } from "framer-motion"
import { authFetch } from "../../lib/authFetch"

import { useSearchParams } from "next/navigation"


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

  /* =========================================================
  WHATSAPP SHARE
  ========================================================= */

  function shareWhatsapp(){

    const text=`Join using my referral code ${referralCode} ${referralLink}`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)

  }

  useEffect(()=>{

    if(!previewAmount) return

    const timeout=setTimeout(()=>{
      handlePreview()
    },600)

    return ()=>clearTimeout(timeout)

  },[previewAmount])

  useEffect(() => {

    const ref = searchParams.get("ref")

    if (ref) {
      setAttachCode(ref.toUpperCase())
    }

  }, [searchParams])

  if (loading) {

    return (

      <div className="flex justify-center items-center h-screen text-purple-400">

        <Loader2 className="animate-spin w-10 h-10" />

      </div>

    )

  }

  const referralCode = dashboard?.my_referral_code
  const relation = dashboard?.relation?.referrer
  const formatRupiah = (value) => {
    if (!value) return ""
    return new Intl.NumberFormat("id-ID").format(value)
  }

  const parseRupiah = (value) => {
    return Number(value.replace(/\D/g, ""))
  }

  const referralLink = `${typeof window !== 'undefined'
    ? window.location.origin
    : ''}/customer/referral?ref=${referralCode}`


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

      {/* ================= REFERRAL SHARE ================= */}

      <Card>

        <div className="flex items-center gap-2 mb-4">

          <Share2 size={18} className="text-purple-400"/>

          <h3 className="font-semibold">
            Your Referral Code & Link
          </h3>

        </div>

        <p className="text-sm text-gray-400 mb-6">
          Share your referral code or link with friends. When they register and make a purchase,
          you will receive commission rewards automatically.
        </p>


        {/* REFERRAL CODE */}

        <div className="mb-5">

          <p className="text-xs text-gray-400 mb-1">
            Referral Code
          </p>

          <div className="flex flex-col sm:flex-row gap-2">

            <input
              readOnly
              value={referralCode || ""}
              className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700 px-4 py-2
              focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              onClick={() => copy(referralCode)}
              className="
              flex items-center justify-center gap-2
              px-4 py-2
              border border-purple-700
              rounded-xl
              hover:bg-purple-700/30
              hover:shadow-[0_0_10px_rgba(168,85,247,0.6)]
              transition
              "
            >
              <Copy size={16}/>
              Copy
            </button>

          </div>

        </div>


        {/* REFERRAL LINK */}

        <div className="mb-5">

          <p className="text-xs text-gray-400 mb-1">
            Referral Link
          </p>

          <div className="flex flex-col sm:flex-row gap-2">

            <input
              readOnly
              value={referralLink}
              className="
              flex-1
              bg-purple-900/40
              border border-purple-700
              px-4 py-2
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-purple-500
              "
            />

            <button
              onClick={()=>copy(referralLink)}
              className="
              flex items-center justify-center gap-2
              border border-purple-700
              px-4 py-2
              rounded-xl
              hover:bg-purple-700/30
              hover:shadow-[0_0_10px_rgba(168,85,247,0.6)]
              transition
              "
            >
              <Copy size={16}/>
              Copy
            </button>

            <button
              onClick={shareWhatsapp}
              className="
              flex items-center justify-center gap-2
              bg-green-600
              px-4 py-2
              rounded-xl
              hover:bg-green-500
              hover:shadow-[0_0_12px_rgba(34,197,94,0.8)]
              transition
              "
            >
              WhatsApp
            </button>

          </div>

        </div>


        {/* HOW IT WORKS */}

        <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-4 text-sm text-gray-300">

          <p className="font-semibold mb-2 text-purple-300">
            How Referral Works
          </p>

          <ul className="space-y-1 list-disc pl-4 text-gray-400">

            <li>Share your referral code or link with friends.</li>

            <li>They register using your referral.</li>

            <li>When they purchase products, you earn commission.</li>

            <li>You can withdraw your commission anytime.</li>

          </ul>

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

      {searchParams.get("ref") && (
        <div className="mb-4 p-3 rounded-lg bg-purple-900/30 border border-purple-700 text-sm">
          Referral code detected. Click <b>Attach</b> to activate referral benefits.
        </div>
      )}

      {/* ================= PREVIEW DISCOUNT ================= */}

      <Card className="mt-6">

        <div className="flex items-center gap-2 mb-3">

          <Gift size={18} className="text-purple-400"/>

          <h3 className="font-semibold">
            Preview Referral Discount
          </h3>

        </div>

        <p className="text-sm text-gray-400 mb-5">
          Estimate the discount you will receive when using a referral.
          The calculation updates automatically as you type the purchase amount.
        </p>

        {/* INPUT */}

        <div className="space-y-2">

          <label className="text-xs text-gray-400">
            Purchase Amount
          </label>

          <div className="flex flex-col sm:flex-row gap-2">

            <input
              type="text"
              value={formatRupiah(previewAmount)}
              onChange={(e)=>{
                const raw=parseRupiah(e.target.value)
                setPreviewAmount(raw)
              }}
              placeholder="Example: 100.000"
              className="
              flex-1
              rounded-xl
              bg-purple-900/40
              border border-purple-700
              px-4 py-2
              focus:outline-none focus:ring-2 focus:ring-purple-500
              "
            />

            <button
              onClick={handlePreview}
              className="
              bg-purple-700
              px-4
              rounded-xl
              hover:bg-purple-600
              hover:shadow-[0_0_10px_rgba(168,85,247,0.7)]
              transition
              flex items-center justify-center
              "
            >

              {previewLoading
                ? <Loader2 className="animate-spin"/>
                : "Check"}

            </button>

          </div>

        </div>

        {/* RESULT */}

        {preview && (

          <div className="mt-6 space-y-4">

            {/* DISCOUNT RESULT */}

            <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-4 text-sm space-y-2">

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Purchase Amount
                </span>

                <span>
                  Rp {preview.amount?.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Referral Discount
                </span>

                <span className="text-green-400 font-semibold">
                  Rp {preview.discount_amount?.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between text-base font-semibold">

                <span>
                  Final Price
                </span>

                <span className="text-purple-300">
                  Rp {preview.final_amount?.toLocaleString()}
                </span>

              </div>

            </div>

            {/* DISCOUNT PROGRESS BAR */}

            <div>

              <p className="text-xs text-gray-400 mb-1">
                Discount Ratio
              </p>

              <div className="w-full bg-purple-900/30 rounded-full h-2">

                <div
                  style={{
                    width: preview.amount
                      ? `${Math.min((preview.discount_amount / preview.amount) * 100,100)}%`
                      : "0%"
                  }}
                  className="h-2 bg-green-400 rounded-full transition-all duration-500"
                />

              </div>

            </div>

            {/* ELIGIBILITY STATUS */}

            {preview.eligible === false && (

              <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-xs text-red-400">

                {preview.reason || "Referral discount is not eligible for this order amount."}

              </div>

            )}

            {preview.eligible === true && (

              <div className="bg-green-900/20 border border-green-800 rounded-xl p-3 text-xs text-green-400">

                Referral discount can be applied to this order.

              </div>

            )}

            {/* MINIMUM ORDER INDICATOR */}

            {preview.settings?.min_order_amount && (

              <div className="text-xs text-gray-400">

                Minimum order required:{" "}
                <span className="text-purple-300 font-semibold">
                  Rp {preview.settings.min_order_amount.toLocaleString()}
                </span>

              </div>

            )}

          </div>

        )}

        {/* INFO */}

        <div className="mt-6 text-xs text-gray-500 leading-relaxed">

          This preview calculates the potential referral discount based on your purchase amount.
          The final discount will be applied automatically during checkout if all referral
          requirements are met.

        </div>

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