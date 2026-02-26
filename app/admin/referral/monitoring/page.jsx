'use client'
import { useState } from 'react'
import ReferralTabs from '../components/ReferralTabs'
import TableWrapper from '../components/TableWrapper'
import FilterBar from '../components/FilterBar'
import Link from 'next/link'

export default function MonitoringReferralPage() {
  const commissionType = 'percent' // atau 'fixed'
  const commissionValue = 5 

  const users = [
    { name: 'Ravi Kusuma', code: 'REF-RAVI123', total: 8, valid: 7, pending: 1, invalid: 0, totalBelanja: 800000 }
  ]

  const calculateCommission = (totalBelanja) => {
    if (commissionType === 'percent') {
      return totalBelanja * (commissionValue / 100)
    }
    return commissionValue * totalBelanja // kalau fixed per transaksi nanti disesuaikan
  }

  const exportCSV = () => {
    const headers = ['Nama', 'Kode', 'Total', 'Valid', 'Pending', 'Invalid', 'Komisi']
    const rows = users.map(u => [
        u.name,
        u.code,
        u.total,
        u.valid,
        u.pending,
        u.invalid,
        calculateCommission(u.totalBelanja)
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
        <button
            onClick={exportCSV}
            className="mb-4 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
            >
            Export CSV
        </button>

      <TableWrapper>
        <FilterBar />
        <table className="w-full text-sm">
          <thead className="text-gray-300 border-b border-gray-700">
            <tr>
              <th>User / Kode Referral</th>
              <th>Total Referral</th>
              <th>Valid</th>
              <th>Pending</th>
              <th>Invalid</th>
              <th>Total Komisi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-3">
                  {u.name}<br />
                  <span className="text-gray-400 text-xs">{u.code}</span>
                </td>
                <td>{u.total}</td>
                <td>{u.valid}</td>
                <td>{u.pending}</td>
                <td>{u.invalid}</td>
                <td className="text-green-400 font-semibold">
                  Rp {calculateCommission(u.totalBelanja).toLocaleString()}
                </td>
                <td>
                  <Link href="/admin/referral/detail/1" className="bg-purple-700 px-3 py-1 rounded-lg">👁</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
