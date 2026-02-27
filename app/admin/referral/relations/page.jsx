'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import ReferralTabs from '../components/ReferralTabs'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ReferralRelationsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')

      const params = new URLSearchParams({
        page,
        q: search,
        date_from: dateFrom,
        date_to: dateTo,
      })

      const res = await fetch(
        `${API}/api/v1/admin/referrals?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()

      if (json.success) {
        setData(json.data.data)
        setLastPage(json.data.last_page)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, search, dateFrom, dateTo])

  const handleForceUnlock = async (userId) => {
    const confirm = window.confirm('Yakin ingin force unlock referral ini?')
    if (!confirm) return

    const token = Cookies.get('token')

    await fetch(
      `${API}/api/v1/admin/referrals/${userId}/force-unlock`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    fetchData()
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      {/* FILTER */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search user / email / referral code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="bg-black border border-purple-600 px-4 py-2 rounded-lg"
        />

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-black border border-purple-600 px-4 py-2 rounded-lg"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-black border border-purple-600 px-4 py-2 rounded-lg"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-purple-700/40 rounded-xl">
        {loading ? (
          <div className="p-6 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700 text-gray-300">
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Referrer</th>
                <th>Locked At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-gray-800">
                  <td className="py-3">{row.id}</td>

                  <td>
                    {row.user?.name}
                    <br />
                    <span className="text-xs text-gray-400">
                      {row.user?.email}
                    </span>
                  </td>

                  <td>
                    {row.referrer?.name}
                    <br />
                    <span className="text-xs text-gray-400">
                      {row.referrer?.email}
                    </span>
                  </td>

                  <td>
                    {row.locked_at
                      ? new Date(row.locked_at).toLocaleDateString('id-ID')
                      : '-'}
                  </td>

                  <td>
                    <button
                      onClick={() => handleForceUnlock(row.user_id)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
                    >
                      Force Unlock
                    </button>
                  </td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-1 bg-purple-800 rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span>
          {page} / {lastPage}
        </span>

        <button
          disabled={page === lastPage}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-1 bg-purple-800 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}