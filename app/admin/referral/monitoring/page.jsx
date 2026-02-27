'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import ReferralTabs from '../components/ReferralTabs'
import TableWrapper from '../components/TableWrapper'
import FilterBar from '../components/FilterBar'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL

export default function MonitoringReferralPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)

      const token = Cookies.get('token')
      const res = await fetch(
        `${API}/api/v1/admin/referrals/monitoring?page=${page}&q=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()

      if (json.success) {
        setUsers(json.data.data)
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
  }, [page, search])

  const exportCSV = () => {
    const headers = [
      'Nama',
      'Email',
      'Kode',
      'Total',
      'Valid',
      'Pending',
      'Invalid',
      'Komisi'
    ]

    const rows = users.map(u => [
      u.name,
      u.email,
      u.referral_code,
      u.total_referral,
      u.valid,
      u.pending,
      u.invalid,
      u.total_komisi
    ])

    let csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map(e => e.join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'referral-report.csv')
    document.body.appendChild(link)
    link.click()
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Cari referrer..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="bg-black border border-purple-600 px-4 py-2 rounded-lg"
        />

        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
        >
          Export CSV
        </button>
      </div>

      <TableWrapper>
        {loading ? (
          <div className="p-6 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th>User / Kode Referral</th>
                <th>Total</th>
                <th>Valid</th>
                <th>Pending</th>
                <th>Invalid</th>
                <th>Total Komisi</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="py-3">
                    {u.name}<br />
                    <span className="text-gray-400 text-xs">
                      {u.referral_code}
                    </span>
                  </td>
                  <td>{u.total_referral}</td>
                  <td>{u.valid}</td>
                  <td>{u.pending}</td>
                  <td>{u.invalid}</td>
                  <td className="text-green-400 font-semibold">
                    Rp {Number(u.total_komisi).toLocaleString('id-ID')}
                  </td>
                  <td>
                    <Link
                      href={`/admin/referral/detail/${u.id}`}
                      className="bg-purple-700 px-3 py-1 rounded-lg"
                    >
                      👁
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 bg-purple-800 rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span>{page} / {lastPage}</span>

        <button
          disabled={page === lastPage}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 bg-purple-800 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}