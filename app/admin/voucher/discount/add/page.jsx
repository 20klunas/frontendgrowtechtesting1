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
      .then(json => {
        const list = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.data)
          ? json.data.data
          : []

        setSubcategories(list)
      })

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

  /* ================= FILTER ================= */
  const filteredSubcategories = useMemo(() => {
    return subcategories.filter(s =>
      (s.name || '').toLowerCase().includes(subcategorySearch.toLowerCase())
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

  /* ================= TARGET ================= */
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

  /* ================= RUPIAH ================= */
  const formatRupiah = value =>
    value ? new Intl.NumberFormat('id-ID').format(value) : ''

  const parseRupiah = value =>
    value.replace(/\./g, '')

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
    <div className="p-10 max-w-5xl mx-auto text-white space-y-6">

      <h1 className="text-4xl font-bold">Tambah Discount</h1>

      {/* BASIC INFO */}
      <Section title="Informasi Dasar">
        <Input label="Nama Discount *"
          onChange={v => setForm({ ...form, name: v })} />

        <Input label="Discount Value *" type="number"
          onChange={v =>
            setForm({ ...form, discount_value: Number(v) })} />

        <Select label="Discount Type *"
          options={['percent', 'fixed']}
          onChange={v =>
            setForm({ ...form, discount_type: v })} />

        <Input label="Priority *" type="number"
          onChange={v =>
            setForm({ ...form, priority: Number(v) })} />

        <Select label="Stack Policy *"
          options={['stackable', 'exclusive']}
          onChange={v =>
            setForm({ ...form, stack_policy: v })} />
      </Section>

      {/* RULES */}
      <Section title="Aturan Discount">
        <Input
          label="Min Order Amount (Rp)"
          value={formatRupiah(form.min_order_amount)}
          onChange={v =>
            setForm({
              ...form,
              min_order_amount: parseRupiah(v),
            })}
        />

        <Input
          label="Max Discount Amount (Rp)"
          value={formatRupiah(form.max_discount_amount)}
          onChange={v =>
            setForm({
              ...form,
              max_discount_amount: parseRupiah(v),
            })}
        />

        <Input label="Usage Limit Total"
          type="number"
          onChange={v =>
            setForm({ ...form, usage_limit_total: v })}
        />

        <Input label="Usage Limit Per User"
          type="number"
          onChange={v =>
            setForm({ ...form, usage_limit_per_user: v })}
        />
      </Section>

      {/* DATE RANGE */}
      <Section title="Jadwal Aktif">
        <Input label="Starts At *"
          type="datetime-local"
          onChange={v =>
            setForm({ ...form, starts_at: v })}
        />

        <Input label="Ends At *"
          type="datetime-local"
          onChange={v =>
            setForm({ ...form, ends_at: v })}
        />

        {hasConflict && (
          <div className="col-span-2 bg-red-900/20 border border-red-600/40 text-red-400 px-4 py-3 rounded-xl">
            ⚠ Jadwal bertabrakan dengan discount lain
          </div>
        )}
      </Section>

      {/* TARGETS */}
      <Section title="Target Discount">
        <SearchableDropdown
          label="Target Subcategory"
          placeholder="Cari subcategory..."
          search={subcategorySearch}
          setSearch={setSubcategorySearch}
          items={filteredSubcategories}
          onSelect={id => addTarget('subcategory', id)}
        />

        <SearchableDropdown
          label="Target Product"
          placeholder="Cari product..."
          search={productSearch}
          setSearch={setProductSearch}
          items={filteredProducts}
          onSelect={id => addTarget('product', id)}
        />

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
              <button onClick={() => removeTarget(t.type, t.id)}>
                ❌
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ENABLE */}
      <div className="border border-purple-700/40 rounded-xl p-4">
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={e =>
              setForm({ ...form, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      <button
        onClick={handleSubmit}
        className="btn-primary w-full"
      >
        Simpan Discount
      </button>
    </div>
  )
}

/* ================= UI COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div className="border border-purple-700/40 rounded-2xl p-6 bg-black/40">
      <h2 className="text-lg font-semibold mb-4 text-purple-300">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

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
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

/* ================= SEARCHABLE DROPDOWN ================= */

function SearchableDropdown({
  label,
  placeholder,
  search,
  setSearch,
  items,
  onSelect,
}) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>

      <input
        className="input w-full mb-2"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="border border-purple-700/40 rounded-lg max-h-40 overflow-y-auto bg-purple-900/10">
        {items.length === 0 && (
          <p className="text-xs text-gray-500 p-2">
            Tidak ada data
          </p>
        )}

        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="px-3 py-2 hover:bg-purple-700/20 cursor-pointer text-sm"
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}
