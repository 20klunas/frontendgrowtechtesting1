'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function AddDiscountPage() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()

  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [existingDiscounts, setExistingDiscounts] = useState([])

  const [subcategorySearch, setSubcategorySearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    enabled: true,
    starts_at: '',
    ends_at: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit_total: '',
    usage_limit_per_user: '',
    priority: 0,
    stack_policy: 'stackable',
    targets: [],
  })

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetch(`${API}/api/v1/admin/subcategories`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then(res => res.json())
      .then(json => setSubcategories(json.data || []))

    fetch(`${API}/api/v1/admin/products`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then(res => res.json())
      .then(json => setProducts(json.data || []))

    fetch(`${API}/api/v1/admin/discount-campaigns`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then(res => res.json())
      .then(json =>
        setExistingDiscounts(json.data?.data || json.data || [])
      )
  }, [])

  /* ================= TARGET FILTER ================= */
  const filteredSubcategories = useMemo(() => {
    return subcategories.filter(s =>
      s.name.toLowerCase().includes(subcategorySearch.toLowerCase())
    )
  }, [subcategorySearch, subcategories])

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    )
  }, [productSearch, products])

  /* ================= CONFLICT DETECTOR ================= */
  const hasConflict = useMemo(() => {
    if (!form.starts_at || !form.ends_at) return false

    const start = new Date(form.starts_at)
    const end = new Date(form.ends_at)

    return existingDiscounts.some(d => {
      if (!d.starts_at || !d.ends_at) return false

      const dStart = new Date(d.starts_at)
      const dEnd = new Date(d.ends_at)

      return start <= dEnd && end >= dStart
    })
  }, [form.starts_at, form.ends_at, existingDiscounts])

  /* ================= TARGET HANDLER ================= */
  const addTarget = (type, id) => {
    if (!id) return

    const exists = form.targets.some(
      t => t.type === type && t.id === Number(id)
    )
    if (exists) return alert('Target sudah ditambahkan')

    setForm(prev => ({
      ...prev,
      targets: [...prev.targets, { type, id: Number(id) }],
    }))
  }

  const removeTarget = (type, id) => {
    setForm(prev => ({
      ...prev,
      targets: prev.targets.filter(
        t => !(t.type === type && t.id === id)
      ),
    }))
  }

  /* ================= FORMAT RUPIAH ================= */
  const formatRupiah = (value) => {
    if (!value) return ''
    return new Intl.NumberFormat('id-ID').format(value)
  }

  const parseRupiah = (value) => {
    return value.replace(/\./g, '')
  }

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name) return alert('Nama wajib diisi')
    if (!form.discount_value) return alert('Value wajib diisi')
    if (!form.starts_at || !form.ends_at)
      return alert('Tanggal wajib diisi')

    const payload = {
      ...form,
      min_order_amount: form.min_order_amount || null,
      max_discount_amount: form.max_discount_amount || null,
      usage_limit_total: form.usage_limit_total || null,
      usage_limit_per_user: form.usage_limit_per_user || null,
    }

    const res = await fetch(`${API}/api/v1/admin/discount-campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return alert('Gagal tambah discount')

    router.push('/admin/voucher/discount')
  }

  return (
    <div className="p-10 max-w-5xl mx-auto text-white">
      <h1 className="text-4xl font-bold mb-10">Tambah Discount</h1>

      <div className="grid grid-cols-2 gap-6">

        <Input
          label="Nama Discount *"
          onChange={v => setForm({ ...form, name: v })}
        />

        <Input
          label="Discount Value *"
          type="number"
          onChange={v =>
            setForm({ ...form, discount_value: Number(v) })
          }
        />

        <Select
          label="Discount Type *"
          options={['percent', 'amount']}
          onChange={v =>
            setForm({ ...form, discount_type: v })
          }
        />

        <Input
          label="Priority *"
          type="number"
          onChange={v =>
            setForm({ ...form, priority: Number(v) })
          }
        />

        <Select
          label="Stack Policy *"
          options={['stackable', 'exclusive']}
          onChange={v =>
            setForm({ ...form, stack_policy: v })
          }
        />

        {/* Currency Formatter */}
        <Input
          label="Min Order Amount (Rp)"
          value={formatRupiah(form.min_order_amount)}
          onChange={v =>
            setForm({
              ...form,
              min_order_amount: parseRupiah(v),
            })
          }
        />

        <Input
          label="Max Discount Amount (Rp)"
          value={formatRupiah(form.max_discount_amount)}
          onChange={v =>
            setForm({
              ...form,
              max_discount_amount: parseRupiah(v),
            })
          }
        />

        <Input
          label="Usage Limit Total"
          type="number"
          onChange={v =>
            setForm({ ...form, usage_limit_total: v })
          }
        />

        <Input
          label="Usage Limit Per User"
          type="number"
          onChange={v =>
            setForm({ ...form, usage_limit_per_user: v })
          }
        />

        {/* Date Range Visual */}
        <div className="col-span-2 grid grid-cols-2 gap-4 bg-purple-900/10 p-4 rounded-xl">
          <Input
            label="Starts At *"
            type="datetime-local"
            onChange={v =>
              setForm({ ...form, starts_at: v })
            }
          />

          <Input
            label="Ends At *"
            type="datetime-local"
            onChange={v =>
              setForm({ ...form, ends_at: v })
            }
          />
        </div>

        {/* Conflict Warning */}
        {hasConflict && (
          <div className="col-span-2 bg-red-900/20 border border-red-600/40 text-red-400 px-4 py-3 rounded-xl">
            ⚠ Jadwal discount bertabrakan dengan campaign lain
          </div>
        )}

        {/* TARGET SEARCH */}
        <div>
          <label className="text-sm text-gray-400">
            Cari Subcategory
          </label>
          <input
            className="input w-full"
            placeholder="Search..."
            onChange={e => setSubcategorySearch(e.target.value)}
          />

          <select
            className="input w-full mt-2"
            onChange={e =>
              addTarget('subcategory', e.target.value)
            }
          >
            <option value="">Pilih</option>
            {filteredSubcategories.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">
            Cari Product
          </label>
          <input
            className="input w-full"
            placeholder="Search..."
            onChange={e => setProductSearch(e.target.value)}
          />

          <select
            className="input w-full mt-2"
            onChange={e =>
              addTarget('product', e.target.value)
            }
          >
            <option value="">Pilih</option>
            {filteredProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* TARGET LIST */}
        <div className="col-span-2">
          <p className="text-sm text-purple-300 mb-2">
            Targets Dipilih
          </p>

          {form.targets.length === 0 && (
            <p className="text-xs text-gray-500">
              Belum ada target
            </p>
          )}

          {form.targets.map(t => (
            <div
              key={`${t.type}-${t.id}`}
              className="flex justify-between bg-purple-900/20 px-3 py-2 rounded-lg mb-2"
            >
              <span>{t.type} #{t.id}</span>
              <button
                onClick={() => removeTarget(t.type, t.id)}
              >
                ❌
              </button>
            </div>
          ))}
        </div>

        <label className="col-span-2 flex gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={e =>
              setForm({ ...form, enabled: e.target.checked })
            }
          />
          Enabled
        </label>

        <button
          onClick={handleSubmit}
          className="btn-primary col-span-2"
        >
          Simpan Discount
        </button>
      </div>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <input
        className="input w-full"
        {...props}
        onChange={e => props.onChange?.(e.target.value)}
      />
    </div>
  )
}

function Select({ label, options, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <select
        className="input w-full"
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Pilih</option>
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
