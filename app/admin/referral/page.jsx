import ReferralTabs from './components/ReferralTabs'

export default function ReferralSettingsPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-2">Admin Referral</h1>
      <ReferralTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Komisi */}
        <div className="border border-purple-600 rounded-2xl p-6 bg-black/40">
          <h2 className="text-xl font-semibold mb-4">Persentase Komisi Referral</h2>

          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="tipe" defaultChecked />
              Persentase (%)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="tipe" />
              Rupiah (Rp)
            </label>
          </div>

          <input type="text" defaultValue="5" className="w-full bg-white text-black rounded-lg px-4 py-2 mb-3" />

          <p className="text-sm text-gray-300 mb-3">
            Komisi akan diterapkan untuk semua produk. Nilai saat ini: 5%
          </p>

          <div className="bg-white text-black p-3 rounded-lg text-sm mb-4">
            <b>Contoh Perhitungan:</b><br />
            Jika pembelian Rp 100.000 dengan komisi 5% = Rp 5.000
          </div>

          <button className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg">
            Simpan Perubahan
          </button>
        </div>

        {/* Minimum WD */}
        <div className="border border-purple-600 rounded-2xl p-6 bg-black/40">
          <h2 className="text-xl font-semibold mb-4">Minimum Saldo Withdrawal</h2>

          <div className="flex mb-3">
            <span className="bg-purple-800 px-3 py-2 rounded-l-lg">Rp</span>
            <input type="text" defaultValue="100.000" className="flex-1 text-black px-3 py-2 rounded-r-lg" />
          </div>

          <p className="text-sm text-gray-300 mb-3">
            User hanya bisa withdraw jika saldo komisi lebih dari nilai ini.
          </p>

          <div className="bg-white text-black p-3 rounded-lg text-sm mb-4">
            <b>Informasi:</b><br />
            User dengan saldo komisi lebih dari Rp 100.000 dapat melakukan withdraw.
          </div>

          <button className="w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  )
}
