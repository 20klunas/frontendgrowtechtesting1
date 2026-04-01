'use client'

import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { AnimatePresence, motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL
const TIERS = ['member', 'reseller', 'vip']

function formatRupiah(value) {
  return String(value || '')
    .replace(/[^\d]/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseRupiah(value) {
  const cleaned = String(value || '').replace(/\./g, '')
  return cleaned === '' ? null : Number(cleaned)
}

export default function VoucherModal({ open, onClose, onSaved, selected }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '',
    type: 'fixed',
    value: '',
    quota: '',
    min_purchase: '',
    expires_at: '',
    is_active: true,
    rules: {
      allowed_tiers: [],
      excluded_tiers: [],
    },
  })

  useEffect(() => {
    if (!selected) {
      setForm({
        code: '',
        type: 'fixed',
        value: '',
        quota: '',
        min_purchase: '',
        expires_at: '',
        is_active: true,
        rules: {
          allowed_tiers: [],
          excluded_tiers: [],
        },
      })
      return
    }

    const sourceRules = selected?.tier_rules || selected?.rules || {}

    setForm({
      code: selected.code || '',
      type: selected.type || 'fixed',
      value: selected.value ? (selected.type === 'fixed' ? formatRupiah(selected.value) : String(selected.value)) : '',
      quota: selected.quota || '',
      min_purchase: selected.min_purchase ? formatRupiah(selected.min_purchase) : '',
      expires_at: selected.expires_at ? formatForInput(selected.expires_at) : '',
      is_active: selected.is_active ?? true,
      rules: {
        allowed_tiers: Array.isArray(sourceRules.allowed_tiers) ? sourceRules.allowed_tiers : [],
        excluded_tiers: Array.isArray(sourceRules.excluded_tiers) ? sourceRules.excluded_tiers : [],
      },
    })
  }, [selected])

  const tierSummary = useMemo(() => {
    if (form.rules.allowed_tiers.length) return `Hanya ${form.rules.allowed_tiers.join(', ')}`
    if (form.rules.excluded_tiers.length) return `Kecuali ${form.rules.excluded_tiers.join(', ')}`
    return 'Semua tier bisa menggunakan voucher ini'
  }, [form.rules])

  if (!open) return null

  const toggleTier = (group, tier) => {
    setForm((prev) => {
      const current = Array.isArray(prev.rules[group]) ? prev.rules[group] : []
      const exists = current.includes(tier)
      const nextGroup = exists ? current.filter((item) => item !== tier) : [...current, tier]
      const otherGroup = group === 'allowed_tiers' ? 'excluded_tiers' : 'allowed_tiers'

      return {
        ...prev,
        rules: {
          ...prev.rules,
          [group]: nextGroup,
          [otherGroup]: (prev.rules[otherGroup] || []).filter((item) => item !== tier),
        },
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = selected ? 'PATCH' : 'POST'
      const url = selected ? `${API}/api/v1/admin/vouchers/${selected.id}` : `${API}/api/v1/admin/vouchers`

      const payload = {
        code: form.code || null,
        type: form.type,
        value: form.type === 'fixed' ? parseRupiah(form.value) : Number(form.value || 0),
        quota: form.quota === '' ? null : Number(form.quota),
        min_purchase: parseRupiah(form.min_purchase),
        expires_at: form.expires_at || null,
        is_active: !!form.is_active,
        rules: {
          allowed_tiers: form.rules.allowed_tiers,
          excluded_tiers: form.rules.excluded_tiers,
        },
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || 'Gagal menyimpan voucher')
      }

      onSaved()
      onClose()
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Gagal menyimpan voucher')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="voucher-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-purple-950/80 to-black border border-purple-600/40 shadow-[0_0_40px_rgba(168,85,247,0.35)] p-6 sm:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{selected ? 'Edit Voucher' : 'Tambah Voucher'}</h2>
                <p className="text-xs text-gray-400 mt-1">Atur voucher beserta aturan tier user.</p>
              </div>

              <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Kode Voucher</label>
                  <input
                    className="premium-input"
                    placeholder="Contoh: PROMO2025"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required={!selected}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400">Status</label>
                  <select
                    className="premium-input"
                    value={form.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Tipe Diskon</label>
                  <select className="premium-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, value: '' })}>
                    <option value="fixed">Rupiah (Potongan Tetap)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400">{form.type === 'fixed' ? 'Nominal Diskon (Rp)' : 'Persentase (%)'}</label>
                  <input
                    className="premium-input"
                    value={form.value}
                    onChange={(e) => setForm({
                      ...form,
                      value: form.type === 'fixed' ? formatRupiah(e.target.value) : e.target.value.replace(/[^\d]/g, ''),
                    })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Kuota</label>
                  <input type="number" className="premium-input" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Minimum Pembelian (Rp)</label>
                  <input className="premium-input" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: formatRupiah(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Tanggal Berakhir</label>
                  <input type="datetime-local" className="premium-input" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                </div>
              </div>

              <div className="rounded-2xl border border-purple-700/40 bg-black/30 p-4 space-y-4">
                <div>
                  <h3 className="font-semibold">Tier User - Allowed</h3>
                  <p className="text-xs text-gray-400">Kalau diisi, voucher hanya berlaku untuk tier yang dipilih.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => (
                    <TierToggle
                      key={`allowed-${tier}`}
                      active={form.rules.allowed_tiers.includes(tier)}
                      onClick={() => toggleTier('allowed_tiers', tier)}
                      label={tier}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-purple-700/40 bg-black/30 p-4 space-y-4">
                <div>
                  <h3 className="font-semibold">Tier User - Excluded</h3>
                  <p className="text-xs text-gray-400">Tier yang dipilih di sini akan diblok dari voucher ini.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => (
                    <TierToggle
                      key={`excluded-${tier}`}
                      active={form.rules.excluded_tiers.includes(tier)}
                      onClick={() => toggleTier('excluded_tiers', tier)}
                      label={tier}
                      variant="danger"
                    />
                  ))}
                </div>
                <div className="text-xs text-purple-300">Ringkasan: {tierSummary}</div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition">
                  Batal
                </button>
                <button disabled={loading} className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <style jsx>{`
        .premium-input {
          width: 100%;
          margin-top: 4px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(88, 28, 135, 0.25);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: white;
          font-size: 14px;
          transition: all 0.25s ease;
        }
        .premium-input:focus {
          outline: none;
          border-color: rgba(168, 85, 247, 0.7);
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.4);
          transform: translateY(-1px);
        }
      `}</style>
    </AnimatePresence>
  )
}

function TierToggle({ active, onClick, label, variant = 'default' }) {
  const activeClass = variant === 'danger'
    ? 'bg-red-600/20 border-red-500 text-red-300'
    : 'bg-purple-600/20 border-purple-500 text-purple-200'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm transition ${active ? activeClass : 'border-white/15 text-gray-300 hover:bg-white/5'}`}
    >
      {label.toUpperCase()}
    </button>
  )
}

function formatForInput(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
