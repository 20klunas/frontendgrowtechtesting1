import ReferralTabs from '../components/ReferralTabs'
import TableWrapper from '../components/TableWrapper'
import FilterBar from '../components/FilterBar'
import Link from 'next/link'

export default function MonitoringReferralPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      <TableWrapper>
        <FilterBar />
        <table className="w-full text-sm">
          <thead className="text-gray-300 border-b border-gray-700">
            <tr>
              <th className="text-left py-3">User / Kode Referral</th>
              <th>Total Referral</th>
              <th>Valid</th>
              <th>Pending</th>
              <th>Invalid</th>
              <th>Total Komisi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-3">
                  Ravi Kusuma <br />
                  <span className="text-gray-400 text-xs">REF-RAVI123</span>
                </td>
                <td>8</td>
                <td>7</td>
                <td>1</td>
                <td>0</td>
                <td>Rp 400.000</td>
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
