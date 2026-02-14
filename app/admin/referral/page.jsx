'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import ReferralTabs from './components/ReferralTabs'
import { motion } from 'framer-motion'

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

  const formatRupiah = (value) => {
    const number = value.replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(number)
  }

  const unformatRupiah = (value) => {
    return value.replace(/\./g, '')
  }

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
      console.error(err)
      showToast('Gagal memuat referral settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCommission = async () => {
    const token = Cookies.get('token')
    if (!settings || !token) return

    setSavingCommission(true)

    try {
      const res = await fetch(`${API}/api/v1/admin/referral-settings/${settings.id}`, {
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

      if (res.status === 401) {
        Cookies.remove('token')
        router.replace('/login')
        return
      }

      const json = await res.json()

      if (json.success) {
        fetchSettings(token)
        showToast('Komisi berhasil diperbarui')
      } else {
        showToast('Gagal menyimpan komisi', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Terjadi kesalahan server', 'error')
    } finally {
      setSavingCommission(false)
    }
  }

  const handleSaveWithdrawal = async () => {
    const token = Cookies.get('token')
    if (!settings || !token) return

    setSavingWithdrawal(true)

    try {
      const res = await fetch(`${API}/api/v1/admin/referral-settings/${settings.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          min_withdrawal: Number(unformatRupiah(minWithdrawal)),
        }),
      })

      if (res.status === 401) {
        Cookies.remove('token')
        router.replace('/login')
        return
      }

      const json = await res.json()

      if (json.success) {
        fetchSettings(token)
        showToast('Minimum withdrawal berhasil diperbarui')
      } else {
        showToast('Gagal menyimpan minimum withdrawal', 'error')
      }
    } catch (err) {
      console.error(err)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-purple-600/60 bg-black p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-700 rounded w-1/2 mb-6" />
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-10 bg-gray-700 rounded mb-4" />
              <div className="h-16 bg-gray-700 rounded mb-4" />
              <div className="h-10 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 text-white">
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-3 rounded-lg shadow-lg text-sm z-50
            ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}
          `}
        >
          {toast.message}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Komisi */}
        <motion.div
          className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-xl font-semibold mb-4">Persentase Komisi Referral</h2>

          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tipe"
                checked={commissionType === 'percent'}
                onChange={() => setCommissionType('percent')}
              />
              Persentase (%)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tipe"
                checked={commissionType === 'fixed'}
                onChange={() => setCommissionType('fixed')}
              />
              Rupiah (Rp)
            </label>
          </div>

          <input
            type="text"
            value={commissionValue}
            onChange={(e) => setCommissionValue(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-white text-black rounded-lg px-4 py-2 mb-3"
          />

          <p className="text-sm text-gray-300 mb-3">
            Komisi akan diterapkan untuk semua produk. Nilai saat ini:{' '}
            {commissionType === 'percent'
              ? `${commissionValue}%`
              : `Rp ${Number(commissionValue || 0).toLocaleString('id-ID')}`}
          </p>

          <div className="bg-white text-black p-3 rounded-lg text-sm mb-4">
            <b>Contoh Perhitungan:</b><br />
            Jika pembelian Rp 100.000 dengan komisi {commissionValue}
            {commissionType === 'percent' ? '%' : ' (Rp)'} ={' '}
            {commissionType === 'percent'
              ? `Rp ${(100000 * (commissionValue || 0) / 100).toLocaleString('id-ID')}`
              : `Rp ${Number(commissionValue || 0).toLocaleString('id-ID')}`}
          </div>

          <button
            onClick={handleSaveCommission}
            disabled={savingCommission}
            className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg disabled:opacity-50"
          >
            {savingCommission ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </motion.div>

        {/* Minimum WD */}
        <motion.div
          className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-xl font-semibold mb-4">Minimum Saldo Withdrawal</h2>

          <div className="flex mb-3">
            <span className="bg-purple-800 px-3 py-2 rounded-l-lg">Rp</span>
            <input
              type="text"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(formatRupiah(e.target.value))}
              className="flex-1 text-black px-3 py-2 rounded-r-lg"
            />
          </div>

          <p className="text-sm text-gray-300 mb-3">
            User hanya bisa withdraw jika saldo komisi lebih dari nilai ini.
          </p>

          <div className="bg-white text-black p-3 rounded-lg text-sm mb-4">
            <b>Informasi:</b><br />
            User dengan saldo komisi lebih dari Rp{' '}
            {Number(unformatRupiah(minWithdrawal || '0')).toLocaleString('id-ID')} dapat melakukan withdraw.
          </div>

          <button
            onClick={handleSaveWithdrawal}
            disabled={savingWithdrawal}
            className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg disabled:opacity-50"
          >
            {savingWithdrawal ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
