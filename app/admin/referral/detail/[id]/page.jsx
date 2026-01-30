import TableWrapper from '../../components/TableWrapper'
import FilterBar from '../../components/FilterBar'

export default function DetailReferralPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-6">Detail Referral - Ravi Kusuma</h1>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-200 text-black rounded-xl p-4">
          <p>Total</p>
          <h2 className="text-3xl font-bold">8</h2>
        </div>
        <div className="bg-green-700 rounded-xl p-4">
          <p>Total</p>
          <h2 className="text-3xl font-bold">7</h2>
        </div>
        <div className="bg-yellow-600 rounded-xl p-4">
          <p>Total</p>
          <h2 className="text-3xl font-bold">1</h2>
        </div>
        <div className="bg-red-700 rounded-xl p-4">
          <p>Total</p>
          <h2 className="text-3xl font-bold">8</h2>
        </div>
      </div>

      <TableWrapper>
        <FilterBar />
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 text-gray-300">
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Status</th>
              <th>Komisi</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-3">Ravi Kusuma</td>
                <td>user1@gmail.com</td>
                <td className="text-green-400">Valid</td>
                <td>Rp 5.000</td>
                <td>12-12-2025</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
