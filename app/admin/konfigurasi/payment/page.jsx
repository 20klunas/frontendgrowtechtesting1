'use client'

import { useEffect, useState } from 'react'
import SectionCard from '../../../components/admin/SectionCard'
import Cookies from 'js-cookie'

export default function PaymentPage() {
  const [loading, setLoading] = useState(true)
  const [percent, setPercent] = useState(null)

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const token = Cookies.get('token')

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/settings?group=payment&key=fee_percent`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        )

        const json = await res.json()

        if (json.success && json.data.length > 0) {
          const value = json.data[0].value
          setPercent(json.data.value.percent)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSetting()
  }, [])

  return (
    <SectionCard title="Konfigurasi Payment">
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-300">Fee Percent:</p>
          <p className="text-xl font-semibold text-white">
            {percent ? `${percent}%` : 'Belum diset'}
          </p>
        </div>
      )}
    </SectionCard>
  )
}