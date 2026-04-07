'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import ReferralTabs from './components/ReferralTabs'
import { motion } from 'framer-motion'
import PermissionGate from '../../components/admin/PermissionGate'
const API = process.env.NEXT_PUBLIC_API_URL

export default function ReferralSettingsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingCommission, setSavingCommission] = useState(false)
  const [savingWithdrawal, setSavingWithdrawal] = useState(false)

  const [settings, setSettings] = useState(null)

  const [commissionType, setCommissionType] = useState('percent')
  const [commissionValue, setCommissionValue] = useState('')
  const [discountType, setDiscountType] = useState('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [discountMaxAmount, setDiscountMaxAmount] = useState('')
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
        setCommissionValue(String(data.commission_value ?? ''))
        setDiscountType(data.discount_type || 'percent')
        setDiscountValue(String(data.discount_value ?? ''))
        setDiscountMaxAmount(formatRupiah(String(data.discount_max_amount ?? '')))
        setMinWithdrawal(formatRupiah(String(data.min_withdrawal ?? '')))
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
          discount_type: discountType,
          discount_value: Number(discountValue),
          discount_max_amount: Number(unformatRupiah(discountMaxAmount || '0')),
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
        showToast('Komisi & diskon referral berhasil diperbarui')
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
      <div className="admin px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold modal-title">
            Admin Referral
          </h1>

          <p className="modal-text text-sm">
            Kelola komisi, diskon referral, dan aturan withdrawal sistem
          </p>
        </div>
        <ReferralTabs />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
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
    <PermissionGate permission="manage_referrals">
      <div className="admin px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="max-w-6xl mx-auto">
          {toast && (
            <div
              className={`fixed top-5 right-5 px-4 py-3 rounded-lg shadow-lg text-sm z-50
                ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}
              `}
            >
              {toast.message}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold modal-title">
              Admin Referral
            </h1>

            <p className="modal-text text-sm">
              Kelola komisi, diskon referral, dan aturan withdrawal sistem
            </p>
          </div>
          <ReferralTabs />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Komisi */}
            <motion.div
              className="modal-card rounded-2xl p-6 md:p-8 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >

              <h2 className="text-xl font-semibold mb-4 modal-title">
                Persentase Komisi Referral
              </h2>

              <div className="flex flex-wrap gap-4 mb-4 modal-text">

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={commissionType === 'percent'}
                    onChange={() => setCommissionType('percent')}
                  />
                  Persentase (%)
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={commissionType === 'fixed'}
                    onChange={() => setCommissionType('fixed')}
                  />
                  Rupiah (Rp)
                </label>

              </div>

              <input
                type="text"
                value={commissionValue}
                onChange={(e) =>
                  setCommissionValue(e.target.value.replace(/\D/g, ''))
                }
                className="input-primary w-full mb-3"
              />

              <p className="modal-text text-sm mb-4">
                Komisi berlaku untuk semua produk.
                Nilai saat ini:
                <span className="font-semibold ml-1">
                  {commissionType === 'percent'
                    ? `${commissionValue}%`
                    : `Rp ${Number(commissionValue || 0).toLocaleString('id-ID')}`}
                </span>
              </p>

              <div className="p-4 rounded-lg border border-purple-700/40 text-sm modal-text mb-5">

                <b>Contoh Perhitungan</b>

                <div className="mt-1">
                  Pembelian Rp 100.000 dengan komisi {commissionValue}
                  {commissionType === 'percent' ? '%' : ' (Rp)'} =
                  <span className="font-semibold ml-1">
                    {commissionType === 'percent'
                      ? `Rp ${(100000 * (commissionValue || 0) / 100).toLocaleString('id-ID')}`
                      : `Rp ${Number(commissionValue || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>

              </div>

              <button
                onClick={handleSaveCommission}
                disabled={savingCommission}
                className="btn-primary w-full"
              >
                {savingCommission ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>

            </motion.div>

            <motion.div
              className="modal-card rounded-2xl p-6 md:p-8 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4 modal-title">
                Diskon Referral Untuk Pembeli
              </h2>

              <div className="flex flex-wrap gap-4 mb-4 modal-text">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={discountType === 'percent'}
                    onChange={() => setDiscountType('percent')}
                  />
                  Persentase (%)
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={discountType === 'fixed'}
                    onChange={() => setDiscountType('fixed')}
                  />
                  Rupiah (Rp)
                </label>
              </div>

              <input
                type="text"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value.replace(/\D/g, ''))}
                className="input-primary w-full mb-3"
              />

              <div className="flex w-full mb-4">
                <span className="flex items-center px-4 border border-purple-700 rounded-l-lg modal-text">
                  Max
                </span>
                <input
                  type="text"
                  value={discountMaxAmount}
                  onChange={(e) => setDiscountMaxAmount(formatRupiah(e.target.value))}
                  className="input-primary flex-1 rounded-l-none"
                  placeholder="0 = tanpa batas"
                />
              </div>

              <p className="modal-text text-sm mb-4">
                Contoh pembelian Rp 100.000 akan mendapat diskon{' '}
                <span className="font-semibold ml-1">
                  {discountType === 'percent'
                    ? `Rp ${Math.floor(100000 * Number(discountValue || 0) / 100).toLocaleString('id-ID')}`
                    : `Rp ${Number(discountValue || 0).toLocaleString('id-ID')}`}
                </span>
                {Number(unformatRupiah(discountMaxAmount || '0')) > 0 ? (
                  <span className="ml-1">
                    (maksimal Rp {Number(unformatRupiah(discountMaxAmount || '0')).toLocaleString('id-ID')})
                  </span>
                ) : null}
              </p>

              <div className="p-4 rounded-lg border border-purple-700/40 text-sm modal-text mb-5">
                <b>Catatan</b>
                <div className="mt-1">
                  Nilai ini dipakai untuk diskon user yang menggunakan kode referral.
                </div>
              </div>

              <button
                onClick={handleSaveCommission}
                disabled={savingCommission}
                className="btn-primary w-full"
              >
                {savingCommission ? 'Menyimpan...' : 'Simpan Komisi & Diskon'}
              </button>
            </motion.div>

            {/* Minimum WD */}
            <motion.div
              className="modal-card rounded-2xl p-6 md:p-8 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >

              <h2 className="text-xl font-semibold mb-4 modal-title">
                Minimum Saldo Withdrawal
              </h2>

              <div className="flex w-full mb-4">

                <span className="
                  flex items-center
                  px-4
                  border border-purple-700
                  rounded-l-lg
                  modal-text
                ">
                  Rp
                </span>

                <input
                  type="text"
                  value={minWithdrawal}
                  onChange={(e) =>
                    setMinWithdrawal(formatRupiah(e.target.value))
                  }
                  className="input-primary flex-1 rounded-l-none"
                />

              </div>

              <p className="modal-text text-sm mb-4">
                User hanya dapat melakukan withdrawal jika saldo komisi
                melebihi nilai minimum ini.
              </p>

              <div className="p-4 border border-purple-700/40 rounded-lg text-sm modal-text mb-5">

                <b>Informasi</b>

                <div className="mt-1">
                  Withdrawal tersedia jika saldo komisi lebih dari
                  <span className="font-semibold ml-1">
                    Rp {Number(unformatRupiah(minWithdrawal || '0')).toLocaleString('id-ID')}
                  </span>
                </div>

              </div>

              <button
                onClick={handleSaveWithdrawal}
                disabled={savingWithdrawal}
                className="btn-primary w-full"
              >
                {savingWithdrawal ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>

            </motion.div>
          </div>
        </div>
      </div>
    </PermissionGate>  
  )
}
