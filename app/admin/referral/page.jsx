'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import ReferralTabs from './components/ReferralTabs'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ReferralSettingsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingCommission, setSavingCommission] = useState(false)
  const [savingWithdrawal, setSavingWithdrawal] = useState(false)

  const [settings, setSettings] = useState(null)

  const [commissionType, setCommissionType] = useState('percent')
  const [commissionValue, setCommissionValue] = useState('')
  const [minWithdrawal, setMinWithdrawal] = useState('')

  const [toast, setToast] = useState(null)

  // ======= FAKE STAT SUMMARY (bisa diganti API nanti)
  const totalRevenue = 245000000
  const totalCommissionPaid = 32000000

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.replace('/login')
      return
    }
    fetchSettings(token)
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const formatRupiah = (value = '') => {
    const number = String(value).replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(number)
  }

  const unformatRupiah = (value) => value.replace(/\./g, '')

  const fetchSettings = async (token) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/referral-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()

      if (json.success) {
        const data = json.data
        setSettings(data)
        setCommissionType(data.commission_type)
        setCommissionValue(String(data.commission_value))
        setMinWithdrawal(formatRupiah(String(data.min_withdrawal)))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCommission = async () => {
    const token = Cookies.get('token')
    if (!token) return

    setSavingCommission(true)

    const res = await fetch(`${API}/api/v1/admin/referral-settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commission_type: commissionType,
        commission_value: Number(commissionValue),
      }),
    })

    const json = await res.json()

    if (json.success) {
      fetchSettings(token)
      showToast('Komisi berhasil diperbarui')
      fireConfetti()
    }

    setSavingCommission(false)
  }

  const handleSaveWithdrawal = async () => {
    const token = Cookies.get('token')
    if (!token) return

    setSavingWithdrawal(true)

    const res = await fetch(`${API}/api/v1/admin/referral-settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        min_withdrawal: Number(unformatRupiah(minWithdrawal)),
      }),
    })

    const json = await res.json()

    if (json.success) {
      fetchSettings(token)
      showToast('Minimum withdrawal berhasil diperbarui')
      fireConfetti()
    }

    setSavingWithdrawal(false)
  }

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>
  }

  const simulatedCommission =
    commissionType === 'percent'
      ? 100000 * (commissionValue || 0) / 100
      : Number(commissionValue || 0)

  return (
    <div className="p-8 text-white relative overflow-hidden">

      {/* ===== Glass Neon Background ===== */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-700 opacity-20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-600 opacity-20 blur-[150px] rounded-full"></div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-5 right-5 bg-green-600 px-6 py-3 rounded-xl shadow-xl z-50"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-4xl font-bold mb-2">Admin Referral Settings</h1>
      <ReferralTabs />

      {/* ===== Animated Stat Summary ===== */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[{
          label: 'Total Referral Revenue',
          value: totalRevenue
        }, {
          label: 'Total Commission Paid',
          value: totalCommissionPaid
        }].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-purple-500/30 shadow-lg"
          >
            <div className="text-sm text-gray-300">{stat.label}</div>
            <div className="text-2xl font-bold mt-2">
              Rp {stat.value.toLocaleString('id-ID')}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

        {/* KOMISI */}
        <motion.div
          whileHover={{ y: -6 }}
          className="rounded-2xl bg-black/60 backdrop-blur-lg p-6 border border-purple-600/40 shadow-[0_0_40px_rgba(168,85,247,0.2)]"
        >
          <h2 className="text-xl font-semibold mb-5">
            Persentase Komisi Referral
          </h2>

          <div className="flex gap-4 mb-6">
            {['percent', 'fixed'].map((type) => (
              <button
                key={type}
                onClick={() => setCommissionType(type)}
                className={`px-4 py-2 rounded-lg border transition
                  ${commissionType === type
                    ? 'bg-purple-700 border-purple-500'
                    : 'border-gray-600 hover:border-purple-400'}
                `}
              >
                {type === 'percent' ? 'Persentase (%)' : 'Rupiah (Rp)'}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={commissionValue}
            onChange={(e) =>
              setCommissionValue(e.target.value.replace(/\D/g, ''))
            }
            className="w-full bg-white text-black rounded-xl px-4 py-3 mb-6"
          />

          {/* Live SVG Graph */}
          <div className="bg-white/10 p-4 rounded-xl mb-6">
            <svg width="100%" height="120">
              <motion.polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
                points={`0,100 50,80 100,${100 - simulatedCommission / 2000}`}
              />
            </svg>
            <div className="mt-2 text-sm">
              Simulasi komisi dari Rp100.000 → Rp{' '}
              {simulatedCommission.toLocaleString('id-ID')}
            </div>
          </div>

          <button
            onClick={handleSaveCommission}
            disabled={savingCommission}
            className="w-full bg-purple-700 py-3 rounded-xl hover:bg-purple-600 transition"
          >
            {savingCommission ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </motion.div>

        {/* MIN WITHDRAW */}
        <motion.div
          whileHover={{ y: -6 }}
          className="rounded-2xl bg-black/60 backdrop-blur-lg p-6 border border-purple-600/40 shadow-[0_0_40px_rgba(168,85,247,0.2)]"
        >
          <h2 className="text-xl font-semibold mb-5">
            Minimum Saldo Withdrawal
          </h2>

          <div className="flex mb-6 rounded-xl overflow-hidden">
            <span className="bg-purple-800 px-4 py-3">Rp</span>
            <input
              type="text"
              value={minWithdrawal}
              onChange={(e) =>
                setMinWithdrawal(formatRupiah(e.target.value))
              }
              className="flex-1 bg-white text-black px-4 py-3 outline-none"
            />
          </div>

          <div className="bg-white text-black p-4 rounded-xl mb-6">
            User bisa withdraw jika saldo ≥ Rp{' '}
            {Number(unformatRupiah(minWithdrawal || '0')).toLocaleString('id-ID')}
          </div>

          <button
            onClick={handleSaveWithdrawal}
            disabled={savingWithdrawal}
            className="w-full bg-purple-700 py-3 rounded-xl hover:bg-purple-600 transition"
          >
            {savingWithdrawal ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </motion.div>

      </div>
    </div>
  )
}