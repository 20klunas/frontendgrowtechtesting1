'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'

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

  useEffect(() => {
    if (selected) {
      setForm({
        code: selected.code,
        type: selected.type,
        value: selected.value,
        quota: selected.quota,
        min_purchase: selected.min_purchase,
        expires_at: selected.expires_at,
        is_active: selected.is_active,
      })
    }
  }, [selected])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

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
        value: Number(form.value),
        quota: Number(form.quota),
        min_purchase: Number(form.min_purchase),
      }),
    })

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-black border border-purple-700 rounded-2xl p-6 w-full max-w-md">

        <h2 className="text-xl font-bold mb-4">
          {selected ? 'Edit Voucher' : 'Tambah Voucher'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input className="input w-full" placeholder="Code"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value })}
          />

          <select className="input w-full"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            <option value="fixed">Rupiah</option>
            <option value="percent">Percent</option>
          </select>

          <input className="input w-full" placeholder="Value"
            value={form.value}
            onChange={e => setForm({ ...form, value: e.target.value })}
          />

          <input className="input w-full" placeholder="Quota"
            value={form.quota}
            onChange={e => setForm({ ...form, quota: e.target.value })}
          />

          <input className="input w-full" placeholder="Min Purchase"
            value={form.min_purchase}
            onChange={e => setForm({ ...form, min_purchase: e.target.value })}
          />

          <input type="datetime-local" className="input w-full"
            value={form.expires_at}
            onChange={e => setForm({ ...form, expires_at: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button className="btn-primary">
              Simpan
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
