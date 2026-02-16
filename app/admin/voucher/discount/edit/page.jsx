'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function EditDiscountPage() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/v1/admin/discount-campaigns/${id}`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then(res => res.json())
      .then(json => setForm(json.data))
  }, [])

  const handleUpdate = async () => {
    const res = await fetch(`${API}/api/v1/admin/discount-campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify(form),
    })

    if (!res.ok) return alert('Gagal update')

    router.push('/admin/voucher/discount')
  }

  if (!form) return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="p-10 max-w-5xl mx-auto text-white">
      <h1 className="text-4xl font-bold mb-10">Edit Discount</h1>

      <div className="border border-purple-700 rounded-2xl p-8 bg-black/60 grid grid-cols-2 gap-6">
        <Input label="Nama Discount" value={form.name}
          onChange={v => setForm({ ...form, name: v })} />

        <Input label="Discount Value" type="number"
          value={form.discount_value}
          onChange={v => setForm({ ...form, discount_value: Number(v) })} />

        <Input label="Priority" type="number"
          value={form.priority}
          onChange={v => setForm({ ...form, priority: Number(v) })} />

        <Select label="Stack Policy"
          value={form.stack_policy}
          options={['stackable', 'exclusive']}
          onChange={v => setForm({ ...form, stack_policy: v })} />

        <button onClick={handleUpdate} className="btn-primary col-span-2">
          Simpan Perubahan
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

function Select({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <select
        className="input w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
