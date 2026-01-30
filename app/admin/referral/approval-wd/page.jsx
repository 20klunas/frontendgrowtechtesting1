import ReferralTabs from '../components/ReferralTabs'
import TableWrapper from '../components/TableWrapper'
import FilterBar from '../components/FilterBar'

export default function ApprovalWDPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      <TableWrapper>
        <FilterBar />
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 text-gray-300">
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Jumlah</th>
              <th>Tanggal Request</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-3">{i + 1}</td>
                <td>Ravi Kusuma</td>
                <td>Rp 5.000</td>
                <td>12-12-2025</td>
                <td className="text-yellow-400">Pending</td>
                <td className="flex gap-2 py-3">
                  <button className="bg-green-500 px-3 py-1 rounded">ACC</button>
                  <button className="bg-red-600 px-3 py-1 rounded">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
