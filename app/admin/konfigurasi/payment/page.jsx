'use client'

import { useEffect, useState } from 'react'
import SectionCard from '../../../components/admin/SectionCard'
import Cookies from 'js-cookie'

export default function PaymentPage() {
  const [loading, setLoading] = useState(true)
  const [percent, setPercent] = useState(null)

  // 🔥 tambahan state baru
  const [editPercent, setEditPercent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const token = Cookies.get('token')

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        )

        const json = await res.json()

        if (json.success && Array.isArray(json.data)) {
          const setting = json.data.find(
            (item) =>
              item.group === 'payment' &&
              item.key === 'fee_percent'
          )

          if (setting && setting.value) {
            setPercent(setting.value.percent)
            setEditPercent(setting.value.percent)
            setIsPublic(setting.is_public ?? true)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSetting()
  }, [])

  // 🔥 POST upsert
  const handleSave = async () => {
    setError(null)

    // 🔥 validasi 0-100
    const numericPercent = parseFloat(editPercent)

    if (isNaN(numericPercent) || numericPercent < 0 || numericPercent > 100) {
      setError('Percent harus antara 0 sampai 100')
      return
    }

    try {
      setSaving(true)

      const token = Cookies.get('token')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/settings/upsert`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            group: 'payment',
            key: 'fee_percent',
            value: { percent: numericPercent },
            is_public: isPublic,
          }),
        }
      )

      const json = await res.json()

      if (json.success) {
        setPercent(numericPercent)
        setToast('Berhasil menyimpan perubahan ✅')

        setTimeout(() => {
          setToast(null)
        }, 3000)
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Konfigurasi Payment">
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-6">

          {/* 🔥 Current Value */}
          <div>
            <p className="text-gray-300">Fee Percent Saat Ini:</p>
            <p className="text-xl font-semibold text-white">
              {percent !== null ? `${percent}%` : 'Belum diset'}
            </p>
          </div>

          {/* 🔥 Form Edit */}
          <div className="space-y-4">

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Edit Fee Percent (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editPercent}
                onChange={(e) => setEditPercent(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 🔥 Toggle is_public */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-300 text-sm">
                Setting dapat diakses public
              </span>
            </div>

            {/* 🔥 Error */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* 🔥 Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

          {/* 🔥 Success Toast */}
          {toast && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
              {toast}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}