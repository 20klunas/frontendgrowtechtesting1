'use client'

import { useEffect, useState } from 'react'
import ReferralTabs from './components/ReferralTabs'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ReferralSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)

  const [commissionType, setCommissionType] = useState('percent')
  const [commissionValue, setCommissionValue] = useState('')
  const [minWithdrawal, setMinWithdrawal] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/referral-settings`)
      const json = await res.json()

      if (json.success) {
        const data = json.data
        setSettings(data)

        setCommissionType(data.commission_type)
        setCommissionValue(data.commission_value)
        setMinWithdrawal(data.min_withdrawal)
      }
    } catch (err) {
      console.error('Failed to fetch referral settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCommission = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/referral-settings/${settings.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commission_type: commissionType,
          commission_value: Number(commissionValue),
        }),
      })

      const json = await res.json()
      if (json.success) {
        fetchSettings()
        alert('Komisi berhasil diperbarui')
      }
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan perubahan')
    }
  }

  const handleSaveWithdrawal = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/referral-settings/${settings.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          min_withdrawal: Number(minWithdrawal),
        }),
      })

      const json = await res.json()
      if (json.success) {
        fetchSettings()
        alert('Minimum withdrawal berhasil diperbarui')
      }
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan perubahan')
    }
  }

  if (loading) {
    return <div className="p-8 text-white">Loading referral settings...</div>
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Komisi */}
        <motion.div
          className="
            rounded-2xl
            border border-purple-600/60
            bg-black
            p-6
            shadow-[0_0_25px_rgba(168,85,247,0.15)]
          "
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
            onChange={(e) => setCommissionValue(e.target.value)}
            className="w-full bg-white text-black rounded-lg px-4 py-2 mb-3"
          />

          <p className="text-sm text-gray-300 mb-3">
            Komisi akan diterapkan untuk semua produk. Nilai saat ini:{' '}
            {commissionType === 'percent'
              ? `${commissionValue}%`
              : `Rp ${Number(commissionValue).toLocaleString('id-ID')}`}
          </p>

          <div className="bg-white text-black p-3 rounded-lg text-sm mb-4">
            <b>Contoh Perhitungan:</b><br />
            Jika pembelian Rp 100.000 dengan komisi {commissionValue}
            {commissionType === 'percent' ? '%' : ' (Rp)'} ={' '}
            {commissionType === 'percent'
              ? `Rp ${(100000 * commissionValue / 100).toLocaleString('id-ID')}`
              : `Rp ${Number(commissionValue).toLocaleString('id-ID')}`}
          </div>

          <button
            onClick={handleSaveCommission}
            className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg"
          >
            Simpan Perubahan
          </button>
        </motion.div>

        {/* Minimum WD */}
        <motion.div
          className="
            rounded-2xl
            border border-purple-600/60
            bg-black
            p-6
            shadow-[0_0_25px_rgba(168,85,247,0.15)]
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-xl font-semibold mb-4">Minimum Saldo Withdrawal</h2>

          <div className="flex mb-3">
            <span className="bg-purple-800 px-3 py-2 rounded-l-lg">Rp</span>
            <input
              type="text"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              className="flex-1 text-black px-3 py-2 rounded-r-lg"
            />
          </div>

          <p className="text-sm text-gray-300 mb-3">
            User hanya bisa withdraw jika saldo komisi lebih dari nilai ini.
          </p>

          <div className="bg-white text-black p-3 rounded-lg text-sm mb-4">
            <b>Informasi:</b><br />
            User dengan saldo komisi lebih dari Rp{' '}
            {Number(minWithdrawal).toLocaleString('id-ID')} dapat melakukan withdraw.
          </div>

          <button
            onClick={handleSaveWithdrawal}
            className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg"
          >
            Simpan Perubahan
          </button>
        </motion.div>
      </div>
    </div>
  )
}
