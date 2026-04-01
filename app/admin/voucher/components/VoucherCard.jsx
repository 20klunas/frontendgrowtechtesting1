'use client'

export default function VoucherCard({ data, onEdit, onDelete, onToggle }) {
  const tierRules = data?.tier_rules || data?.rules || {}
  const allowed = Array.isArray(tierRules.allowed_tiers) ? tierRules.allowed_tiers : []
  const excluded = Array.isArray(tierRules.excluded_tiers) ? tierRules.excluded_tiers : []

  return (
    <div className="border border-purple-700 rounded-2xl p-6 bg-black shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 items-start">
        <Info label="Kode" value={data.code} bold />
        <Info label="Type" value={formatType(data.type)} />
        <Info label="Value" value={formatValue(data)} />
        <Info label="Min. Purchase" value={formatRupiah(data.min_purchase)} />
        <Info label="Quota" value={data.quota} />
        <Info label="Expired" value={formatDate(data.expires_at)} />
        <Info
          label="Tier Rule"
          value={
            allowed.length
              ? `Hanya ${allowed.join(', ')}`
              : excluded.length
                ? `Kecuali ${excluded.join(', ')}`
                : 'Semua tier'
          }
        />

        <div className="md:col-span-3 xl:col-span-7 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mt-3">
          <button onClick={onToggle}>
            <StatusBadge active={data.is_active} />
          </button>

          <div className="flex gap-3">
            <button onClick={onEdit} className="action-btn bg-orange-500">✏</button>
            <button onClick={onDelete} className="action-btn bg-red-600">🗑</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, bold }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`${bold ? 'font-bold text-lg' : 'font-medium'} break-words`}>{value || '-'}</p>
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-green-600/20 text-green-400 border-green-600/40' : 'bg-red-600/20 text-red-400 border-red-600/40'}`}>
      ● {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

function formatType(type) {
  return type === 'fixed' ? 'Rupiah' : 'Percent'
}

function formatValue(data) {
  return data.type === 'fixed' ? formatRupiah(data.value) : `${data.value}%`
}

function formatRupiah(val) {
  if (val === null || val === undefined || val === '') return '-'
  return `Rp ${Number(val).toLocaleString('id-ID')}`
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID')
}
