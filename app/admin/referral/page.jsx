'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import ReferralTabs from './components/ReferralTabs'
import { motion, AnimatePresence } from 'framer-motion'

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

      if (res.status === 401) {
        Cookies.remove('token')
        router.replace('/login')
        return
      }

      const json = await res.json()

      if (json.success) {
        const data = json.data
        setSettings(data)
        setCommissionType(data.commission_type)
        setCommissionValue(String(data.commission_value))
        setMinWithdrawal(formatRupiah(String(data.min_withdrawal)))
      }
    } catch (err) {
      showToast('Gagal memuat referral settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCommission = async () => {
    const token = Cookies.get('token')
    if (!token) return

    setSavingCommission(true)

    try {
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
      } else {
        showToast('Gagal menyimpan komisi', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan server', 'error')
    } finally {
      setSavingCommission(false)
    }
  }

  const handleSaveWithdrawal = async () => {
    const token = Cookies.get('token')
    if (!token) return

    setSavingWithdrawal(true)

    try {
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
      } else {
        showToast('Gagal menyimpan minimum withdrawal', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan server', 'error')
    } finally {
      setSavingWithdrawal(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
        <ReferralTabs />
        <div className="mt-10 text-gray-400">Memuat pengaturan...</div>
      </div>
    )
  }

  return (
    <div className="p-8 text-white relative">

      {/* Animated Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-5 right-5 px-6 py-3 rounded-xl shadow-2xl text-sm z-50
              ${toast.type === 'error'
                ? 'bg-red-600 shadow-red-500/40'
                : 'bg-green-600 shadow-green-500/40'
              }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-4xl font-bold mb-2 tracking-tight">
        Admin Referral Settings
      </h1>

      <ReferralTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

        {/* ================= KOMISI ================= */}
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="rounded-2xl border border-purple-600/60 bg-gradient-to-br from-black to-purple-900/20 p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)] backdrop-blur-md"
        >
          <h2 className="text-xl font-semibold mb-5">
            Persentase Komisi Referral
          </h2>

          {/* Toggle Premium */}
          <div className="flex gap-4 mb-6">
            {['percent', 'fixed'].map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCommissionType(type)}
                className={`px-4 py-2 rounded-lg border transition-all duration-300
                  ${commissionType === type
                    ? 'bg-purple-700 border-purple-500 shadow-lg'
                    : 'border-gray-600 hover:border-purple-500'
                  }`}
              >
                {type === 'percent' ? 'Persentase (%)' : 'Rupiah (Rp)'}
              </motion.button>
            ))}
          </div>

          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            value={commissionValue}
            onChange={(e) =>
              setCommissionValue(e.target.value.replace(/\D/g, ''))
            }
            className="w-full bg-white text-black rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none transition"
          />

          <motion.div
            key={commissionValue + commissionType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white text-black p-4 rounded-xl text-sm mb-6 shadow-md"
          >
            <b>Simulasi Perhitungan</b>
            <div className="mt-2">
              Jika pembelian Rp 100.000 → Komisi:
              <div className="font-semibold mt-1">
                {commissionType === 'percent'
                  ? `Rp ${(100000 * (commissionValue || 0) / 100).toLocaleString('id-ID')}`
                  : `Rp ${Number(commissionValue || 0).toLocaleString('id-ID')}`}
              </div>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveCommission}
            disabled={savingCommission}
            className="w-full bg-purple-700 hover:bg-purple-600 py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-lg"
          >
            {savingCommission ? 'Menyimpan...' : 'Simpan Perubahan'}
          </motion.button>
        </motion.div>

        {/* ================= MIN WITHDRAW ================= */}
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="rounded-2xl border border-purple-600/60 bg-gradient-to-br from-black to-purple-900/20 p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)] backdrop-blur-md"
        >
          <h2 className="text-xl font-semibold mb-5">
            Minimum Saldo Withdrawal
          </h2>

          <div className="flex mb-4 overflow-hidden rounded-xl">
            <span className="bg-purple-800 px-4 py-3 flex items-center font-semibold">
              Rp
            </span>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              value={minWithdrawal}
              onChange={(e) =>
                setMinWithdrawal(formatRupiah(e.target.value))
              }
              className="flex-1 text-black px-4 py-3 outline-none"
            />
          </div>

          <motion.div
            key={minWithdrawal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white text-black p-4 rounded-xl text-sm mb-6 shadow-md"
          >
            User bisa withdraw jika saldo ≥ Rp{' '}
            {Number(unformatRupiah(minWithdrawal || '0')).toLocaleString('id-ID')}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveWithdrawal}
            disabled={savingWithdrawal}
            className="w-full bg-purple-700 hover:bg-purple-600 py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-lg"
          >
            {savingWithdrawal ? 'Menyimpan...' : 'Simpan Perubahan'}
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
}