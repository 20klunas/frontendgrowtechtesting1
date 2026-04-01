'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

const TIERS = ['member', 'reseller', 'vip']

export default function AddDiscountPage() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()

  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [existingDiscounts, setExistingDiscounts] = useState([])
  const [subcategorySearch, setSubcategorySearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)

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
    tier_rules: {
      allowed_tiers: [],
      excluded_tiers: [],
    },
  })

  useEffect(() => {
    fetch(`${API}/api/v1/admin/subcategories`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then((res) => res.json())
      .then((json) => setSubcategories(Array.isArray(json.data) ? json.data : json.data?.data || []))

    fetch(`${API}/api/v1/admin/products`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then((res) => res.json())
      .then((json) => setProducts(Array.isArray(json.data) ? json.data : json.data?.data || []))

    fetch(`${API}/api/v1/admin/discount-campaigns`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    })
      .then((res) => res.json())
      .then((json) => setExistingDiscounts(Array.isArray(json.data?.data) ? json.data.data : json.data || []))
  }, [API])

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((item) => (item.name || '').toLowerCase().includes(subcategorySearch.toLowerCase()))
  }, [subcategorySearch, subcategories])

  const filteredProducts = useMemo(() => {
    return products.filter((item) => (item.name || '').toLowerCase().includes(productSearch.toLowerCase()))
  }, [productSearch, products])

  const hasConflict = useMemo(() => {
    if (!form.starts_at || !form.ends_at) return false
    const start = new Date(form.starts_at)
    const end = new Date(form.ends_at)

    return existingDiscounts.some((discount) => {
      if (!discount.starts_at || !discount.ends_at) return false
      const dStart = new Date(discount.starts_at)
      const dEnd = new Date(discount.ends_at)
      return start <= dEnd && end >= dStart
    })
  }, [form.starts_at, form.ends_at, existingDiscounts])

  const addTarget = (type, targetId) => {
    const id = Number(targetId)
    if (!id) return
    setForm((prev) => {
      if (prev.targets.some((target) => target.type === type && Number(target.id) === id)) return prev
      return { ...prev, targets: [...prev.targets, { type, id }] }
    })
  }

  const removeTarget = (type, targetId) => {
    setForm((prev) => ({
      ...prev,
      targets: prev.targets.filter((target) => !(target.type === type && Number(target.id) === Number(targetId))),
    }))
  }

  const toggleTier = (group, tier) => {
    setForm((prev) => {
      const current = prev.tier_rules[group] || []
      const exists = current.includes(tier)
      const nextGroup = exists ? current.filter((item) => item !== tier) : [...current, tier]
      const otherGroup = group === 'allowed_tiers' ? 'excluded_tiers' : 'allowed_tiers'
      return {
        ...prev,
        tier_rules: {
          ...prev.tier_rules,
          [group]: nextGroup,
          [otherGroup]: (prev.tier_rules[otherGroup] || []).filter((item) => item !== tier),
        },
      }
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
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

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error?.message || 'Gagal membuat discount')
      }

      router.push('/admin/voucher/discount')
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Gagal membuat discount')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-10 max-w-6xl mx-auto text-white space-y-6">
      <h1 className="text-4xl font-bold">Tambah Discount</h1>

      <Section title="Informasi Dasar">
        <Input label="Nama Discount" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Select label="Status" value={form.enabled ? 'enabled' : 'disabled'} options={[{ value: 'enabled', label: 'Aktif' }, { value: 'disabled', label: 'Nonaktif' }]} onChange={(v) => setForm({ ...form, enabled: v === 'enabled' })} />
        <Select label="Discount Type" value={form.discount_type} options={[{ value: 'percent', label: 'Percent (%)' }, { value: 'fixed', label: 'Rupiah (Fixed Amount)' }]} onChange={(v) => setForm({ ...form, discount_type: v })} />
        <Input label="Discount Value" type="number" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: Number(v || 0) })} />
        <Input label="Priority" type="number" value={form.priority} onChange={(v) => setForm({ ...form, priority: Number(v || 0) })} />
        <Select label="Stack Policy" value={form.stack_policy} options={[{ value: 'stackable', label: 'Stackable' }, { value: 'exclusive', label: 'Exclusive' }]} onChange={(v) => setForm({ ...form, stack_policy: v })} />
      </Section>

      <Section title="Aturan Discount">
        <Input label="Min Order Amount (Rp)" type="number" value={form.min_order_amount} onChange={(v) => setForm({ ...form, min_order_amount: v })} />
        <Input label="Max Discount Amount (Rp)" type="number" value={form.max_discount_amount} onChange={(v) => setForm({ ...form, max_discount_amount: v })} />
        <Input label="Usage Limit Total" type="number" value={form.usage_limit_total} onChange={(v) => setForm({ ...form, usage_limit_total: v })} />
        <Input label="Usage Limit Per User" type="number" value={form.usage_limit_per_user} onChange={(v) => setForm({ ...form, usage_limit_per_user: v })} />
      </Section>

      <Section title="Jadwal Aktif">
        <Input label="Starts At" type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
        <Input label="Ends At" type="datetime-local" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} />
        {hasConflict && <div className="col-span-2 rounded-xl border border-red-600/40 bg-red-900/20 px-4 py-3 text-red-400">⚠ Jadwal bertabrakan dengan discount lain</div>}
      </Section>

      <Section title="Aturan Tier User">
        <TierSelector title="Allowed Tiers" description="Jika diisi, discount hanya berlaku untuk tier yang dipilih." value={form.tier_rules.allowed_tiers} onToggle={(tier) => toggleTier('allowed_tiers', tier)} />
        <TierSelector title="Excluded Tiers" description="Tier yang dipilih di sini tidak boleh memakai discount ini." value={form.tier_rules.excluded_tiers} onToggle={(tier) => toggleTier('excluded_tiers', tier)} variant="danger" />
      </Section>

      <Section title="Target Discount">
        <SearchableDropdown label="Target Subcategory" placeholder="Cari subcategory..." search={subcategorySearch} setSearch={setSubcategorySearch} items={filteredSubcategories} onSelect={(id) => addTarget('subcategory', id)} />
        <SearchableDropdown label="Target Product" placeholder="Cari product..." search={productSearch} setSearch={setProductSearch} items={filteredProducts} onSelect={(id) => addTarget('product', id)} />
        <div className="col-span-2">
          <label className="text-sm text-gray-400">Target yang dipilih</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.targets.length === 0 ? <span className="text-gray-500 text-sm">Belum ada target khusus. Jika kosong, discount berlaku global.</span> : form.targets.map((target, index) => (
              <button key={`${target.type}-${target.id}-${index}`} type="button" onClick={() => removeTarget(target.type, target.id)} className="rounded-full border border-purple-600/40 bg-purple-900/30 px-3 py-2 text-sm">
                {target.type}:{target.id} ✕
              </button>
            ))}
          </div>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push('/admin/voucher/discount')} className="rounded-xl border border-gray-600 px-5 py-3 text-gray-300">Batal</button>
        <button onClick={handleSubmit} disabled={saving} className="rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-700 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Discount'}</button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-purple-700/50 bg-black p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white" />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white">
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>{option.label || option}</option>
        ))}
      </select>
    </div>
  )
}

function SearchableDropdown({ label, placeholder, search, setSearch, items, onSelect }) {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-1">{label}</label>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-purple-700/50 bg-zinc-950 px-4 py-3 text-white mb-2" />
      <div className="max-h-48 overflow-auto rounded-xl border border-purple-700/30 bg-zinc-950 p-2">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-900/30">
            {item.name}
          </button>
        ))}
        {items.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Tidak ada data</div>}
      </div>
    </div>
  )
}

function TierSelector({ title, description, value, onToggle, variant = 'default' }) {
  return (
    <div className="rounded-2xl border border-purple-700/40 bg-zinc-950 p-4">
      <div className="font-medium text-white">{title}</div>
      <div className="text-xs text-gray-400 mt-1 mb-3">{description}</div>
      <div className="flex flex-wrap gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => onToggle(tier)}
            className={`rounded-full border px-3 py-2 text-sm ${value.includes(tier) ? (variant === 'danger' ? 'border-red-500 bg-red-600/20 text-red-300' : 'border-purple-500 bg-purple-600/20 text-purple-200') : 'border-white/15 text-gray-300 hover:bg-white/5'}`}
          >
            {tier.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
