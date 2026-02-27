'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { motion, AnimatePresence } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL

export default function VoucherModal({ open, onClose, onSaved, selected }) {
  const [form, setForm] = useState({
    code: '',
    type: 'fixed',
    value: '',
    quota: '',
    min_purchase: '',
    expires_at: '',
    is_active: true,
  })

  const [loading, setLoading] = useState(false)

  // ================= FORMAT RUPIAH =================
  const formatRupiah = (value) => {
    if (!value) return ''
    const number = value.toString().replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(number)
  }

  const parseRupiah = (value) => {
    return Number(value.replace(/\./g, '').replace(/\D/g, ''))
  }

  useEffect(() => {
    if (selected) {
      setForm({
        code: selected.code || '',
        type: selected.type || 'fixed',
        value: selected.value
          ? formatRupiah(selected.value.toString())
          : '',
        quota: selected.quota || '',
        min_purchase: selected.min_purchase
          ? formatRupiah(selected.min_purchase.toString())
          : '',
        expires_at: selected.expires_at || '',
        is_active: selected.is_active ?? true,
      })
    } else {
      setForm({
        code: '',
        type: 'fixed',
        value: '',
        quota: '',
        min_purchase: '',
        expires_at: '',
        is_active: true,
      })
    }
  }, [selected])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const method = selected ? 'PATCH' : 'POST'
    const url = selected
      ? `${API}/api/v1/admin/vouchers/${selected.id}`
      : `${API}/api/v1/admin/vouchers`

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({
        ...form,
        value: parseRupiah(form.value),
        min_purchase: parseRupiah(form.min_purchase),
        quota: Number(form.quota),
      }),
    })

    setLoading(false)
    onSaved()
    onClose()
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
            className="
              w-full
              max-w-lg
              max-h-[90vh]
              overflow-y-auto
              rounded-2xl
              bg-gradient-to-b
              from-purple-950/80
              to-black
              border border-purple-600/40
              shadow-[0_0_40px_rgba(168,85,247,0.35)]
              p-6 sm:p-8
            "
          >

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {selected ? 'Edit Voucher' : 'Tambah Voucher'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Atur detail voucher promo dengan lengkap.
                </p>
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-400 transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* CODE */}
              <div>
                <label className="text-xs text-gray-400">Kode Voucher</label>
                <input
                  className="premium-input"
                  placeholder="Contoh: PROMO2025"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>

              {/* TYPE */}
              <div>
                <label className="text-xs text-gray-400">Tipe Diskon</label>
                <select
                  className="premium-input"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="fixed">Rupiah (Potongan Tetap)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>

              {/* VALUE */}
              <div>
                <label className="text-xs text-gray-400">
                  {form.type === 'fixed' ? 'Nominal Diskon (Rp)' : 'Persentase (%)'}
                </label>
                <input
                  className="premium-input"
                  placeholder={form.type === 'fixed' ? 'Contoh: 100.000' : 'Contoh: 10'}
                  value={form.value}
                  onChange={e =>
                    setForm({
                      ...form,
                      value:
                        form.type === 'fixed'
                          ? formatRupiah(e.target.value)
                          : e.target.value
                    })
                  }
                  required
                />
              </div>

              {/* QUOTA */}
              <div>
                <label className="text-xs text-gray-400">Kuota</label>
                <input
                  type="number"
                  className="premium-input"
                  placeholder="Jumlah penggunaan"
                  value={form.quota}
                  onChange={e => setForm({ ...form, quota: e.target.value })}
                  required
                />
              </div>

              {/* MIN PURCHASE */}
              <div>
                <label className="text-xs text-gray-400">
                  Minimum Pembelian (Rp)
                </label>
                <input
                  className="premium-input"
                  placeholder="Contoh: 500.000"
                  value={form.min_purchase}
                  onChange={e =>
                    setForm({
                      ...form,
                      min_purchase: formatRupiah(e.target.value),
                    })
                  }
                />
              </div>

              {/* EXPIRE */}
              <div>
                <label className="text-xs text-gray-400">Tanggal Berakhir</label>
                <input
                  type="datetime-local"
                  className="premium-input"
                  value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    px-4 py-2 rounded-xl
                    border border-gray-600
                    text-gray-300
                    hover:bg-gray-800
                    transition
                  "
                >
                  Batal
                </button>

                <button
                  disabled={loading}
                  className="
                    px-5 py-2 rounded-xl
                    bg-gradient-to-r from-purple-600 to-purple-500
                    hover:from-purple-500 hover:to-purple-400
                    shadow-[0_0_20px_rgba(168,85,247,0.4)]
                    transition-all
                    disabled:opacity-50
                  "
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>

            </form>

          </motion.div>
        </motion.div>
      )}

      {/* PREMIUM INPUT STYLE */}
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