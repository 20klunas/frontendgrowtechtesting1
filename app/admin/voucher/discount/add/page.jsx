'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function AddDiscountPage() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    enabled: true,
    starts_at: '',
    ends_at: '',
    discount_type: 'percent',
    discount_value: 0,
    subcategory_id: '',
    priority: 0,
    stack_policy: 'stackable',
  })

  const handleSubmit = async () => {
    const res = await fetch(`${API}/api/v1/admin/discount-campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify(form),
    })

    if (!res.ok) return alert('Gagal tambah discount')

    router.push('/admin/voucher/discount')
  }

  return (
    <div className="p-10 max-w-5xl mx-auto text-white">
      <h1 className="text-4xl font-bold mb-10">Tambah Discount</h1>

      <div className="border border-purple-700 rounded-2xl p-8 bg-black/60 grid grid-cols-2 gap-6">
        <Input label="Nama Discount" onChange={v => setForm({ ...form, name: v })} />

        <Input label="Discount Value" type="number"
          onChange={v => setForm({ ...form, discount_value: Number(v) })} />

        <Input label="Subcategory ID" type="number"
          onChange={v => setForm({ ...form, subcategory_id: Number(v) })} />

        <Input label="Priority" type="number"
          onChange={v => setForm({ ...form, priority: Number(v) })} />

        <Select label="Discount Type"
          options={['percent', 'amount']}
          onChange={v => setForm({ ...form, discount_type: v })} />

        <Select label="Stack Policy"
          options={['stackable', 'exclusive']}
          onChange={v => setForm({ ...form, stack_policy: v })} />

        <Input label="Starts At" type="datetime-local"
          onChange={v => setForm({ ...form, starts_at: v })} />

        <Input label="Ends At" type="datetime-local"
          onChange={v => setForm({ ...form, ends_at: v })} />

        <label className="col-span-2 flex gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={e => setForm({ ...form, enabled: e.target.checked })}
          />
          Enabled
        </label>

        <button onClick={handleSubmit} className="btn-primary col-span-2">
          Tambah Discount
        </button>
      </div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <input className="input w-full" {...props}
        onChange={e => props.onChange?.(e.target.value)} />
    </div>
  )
}

function Select({ label, options, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <select className="input w-full" onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
