'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

const defaultForm = {
  category_id: "",
  subcategory_id: "",
  name: "",
  type: "ACCOUNT_CREDENTIAL",
  duration_days: 7,
  description: "",
  member_price: "",
  reseller_price: "",
  vip_price: "",
  member_profit: "",
  reseller_profit: "",
  vip_profit: "",
  is_active: true,
  is_published: false,
}

const tierFields = [
  { key: "member", label: "Member", priceName: "member_price", profitName: "member_profit" },
  { key: "reseller", label: "Reseller", priceName: "reseller_price", profitName: "reseller_profit" },
  { key: "vip", label: "VIP", priceName: "vip_price", profitName: "vip_profit" },
]

export default function ProductForm({ mode, id }) {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const authHeaders = () => {
    const token = Cookies.get("token")
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
  }

  const fetchCategories = async () => {
    const res = await fetch(`${API}/api/v1/admin/categories`, {
      headers: authHeaders(),
      cache: "no-store",
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Gagal mengambil kategori")
    }

    const rows = Array.isArray(json?.data) ? json.data : []
    setCategories(rows)
    return rows
  }

  const fetchSubcategories = async (categoryId = "") => {
    setSubLoading(true)
    try {
      const query = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : ""
      const res = await fetch(`${API}/api/v1/admin/subcategories${query}`, {
        headers: authHeaders(),
        cache: "no-store",
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Gagal mengambil subkategori")
      }

      const rows = Array.isArray(json?.data) ? json.data : []
      setSubcategories(rows)
      return rows
    } finally {
      setSubLoading(false)
    }
  }

  const fetchProduct = async () => {
    if (mode !== "edit" || !id) return null

    const res = await fetch(`${API}/api/v1/admin/products/${id}`, {
      headers: authHeaders(),
      cache: "no-store",
    })
    const json = await res.json().catch(() => null)

    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Gagal load produk")
    }

    return json?.data || null
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        setLoading(true)
        await fetchCategories()

        if (mode === "edit" && id) {
          const product = await fetchProduct()
          if (!mounted || !product) return

          const categoryId = String(product.category_id || "")
          await fetchSubcategories(categoryId)

          setForm({
            category_id: categoryId,
            subcategory_id: product.subcategory_id ? String(product.subcategory_id) : "",
            name: product.name || "",
            type: product.type || "ACCOUNT_CREDENTIAL",
            duration_days: product.duration_days ?? 7,
            description: product.description || "",
            member_price: product.tier_pricing?.member ?? "",
            reseller_price: product.tier_pricing?.reseller ?? "",
            vip_price: product.tier_pricing?.vip ?? "",
            member_profit: product.tier_profit?.member ?? "",
            reseller_profit: product.tier_profit?.reseller ?? "",
            vip_profit: product.tier_profit?.vip ?? "",
            is_active: Boolean(product.is_active),
            is_published: Boolean(product.is_published),
          })
          return
        }

        await fetchSubcategories("")
      } catch (error) {
        console.error(error)
        alert(error.message || "Gagal memuat form produk")
        if (mode === "edit") {
          router.push("/admin/produk")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [mode, id, router])

  const filteredSubcategories = useMemo(() => {
    if (!form.category_id) return subcategories
    return subcategories.filter((item) => String(item.category_id) === String(form.category_id))
  }, [subcategories, form.category_id])

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === "checkbox" ? checked : value

    if (name === "category_id") {
      setForm((prev) => ({
        ...prev,
        category_id: nextValue,
        subcategory_id: "",
      }))

      try {
        await fetchSubcategories(nextValue)
      } catch (error) {
        console.error(error)
        alert(error.message || "Gagal mengambil subkategori")
      }
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }))
  }

  const toNumber = (value) => {
    const parsed = Number(value || 0)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const toNullableId = (value) => {
    const raw = String(value ?? "").trim()
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const payload = {
        category_id: Number(form.category_id),
        subcategory_id: toNullableId(form.subcategory_id),
        name: form.name.trim(),
        type: form.type,
        duration_days: Number(form.duration_days || 0) || null,
        description: form.description,
        tier_pricing: {
          member: toNumber(form.member_price),
          reseller: toNumber(form.reseller_price),
          vip: toNumber(form.vip_price),
        },
        tier_profit: {
          member: toNumber(form.member_profit),
          reseller: toNumber(form.reseller_profit),
          vip: toNumber(form.vip_profit),
        },
        is_active: Boolean(form.is_active),
        is_published: Boolean(form.is_published),
      }

      const url = mode === "edit"
        ? `${API}/api/v1/admin/products/${id}`
        : `${API}/api/v1/admin/products`

      const method = mode === "edit" ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Gagal menyimpan produk")
      }

      alert(mode === "edit" ? "Produk berhasil diubah" : "Produk berhasil ditambahkan")
      router.push("/admin/produk")
    } catch (error) {
      console.error(error)
      alert(error.message || "Gagal menyimpan produk")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-white">Loading...</p>
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-purple-600/60 bg-black p-6">
      <h1 className="mb-2 text-2xl font-bold text-white">
        {mode === "edit" ? "Edit Produk" : "Tambah Produk"}
      </h1>
      <p className="mb-6 text-sm text-white/70">
        Harga tier adalah harga jual. Profit tier disimpan terpisah agar kalkulasi katalog, checkout, dan admin tetap konsisten.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kategori">
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-purple-500/40 bg-zinc-950 px-4 py-3 text-white outline-none"
              required
            >
              <option value="">Pilih kategori</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subkategori">
            <select
              name="subcategory_id"
              value={form.subcategory_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-purple-500/40 bg-zinc-950 px-4 py-3 text-white outline-none"
              disabled={!form.category_id || subLoading}
            >
              <option value="">Tanpa subkategori</option>
              {filteredSubcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-white/50">
              Subkategori opsional. Kosongkan jika produk memang langsung berada di kategori utama.
            </p>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama produk">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-purple-500/40 bg-zinc-950 px-4 py-3 text-white outline-none"
              placeholder="Masukkan nama produk"
              required
            />
          </Field>

          <Field label="Tipe produk">
            <input
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-purple-500/40 bg-zinc-950 px-4 py-3 text-white outline-none"
              placeholder="ACCOUNT_CREDENTIAL"
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Durasi (hari)">
            <input
              name="duration_days"
              type="number"
              min="1"
              value={form.duration_days}
              onChange={handleChange}
              className="w-full rounded-xl border border-purple-500/40 bg-zinc-950 px-4 py-3 text-white outline-none"
            />
          </Field>

          <Field label="Status">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-zinc-950 px-4 py-3 text-sm text-white">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Aktif
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-zinc-950 px-4 py-3 text-sm text-white">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleChange}
                />
                Published
              </label>
            </div>
          </Field>
        </div>

        <Field label="Deskripsi">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-xl border border-purple-500/40 bg-zinc-950 px-4 py-3 text-white outline-none"
            placeholder="Masukkan deskripsi produk"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          {tierFields.map((tier) => (
            <div
              key={tier.key}
              className="rounded-2xl border border-purple-500/30 bg-zinc-950 p-4"
            >
              <h3 className="mb-4 text-lg font-semibold text-white">{tier.label}</h3>

              <Field label="Harga final">
                <input
                  type="number"
                  min="0"
                  name={tier.priceName}
                  value={form[tier.priceName]}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-purple-500/40 bg-black px-4 py-3 text-white outline-none"
                  placeholder="0"
                />
              </Field>

              <Field label="Profit">
                <input
                  type="number"
                  min="0"
                  name={tier.profitName}
                  value={form[tier.profitName]}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-purple-500/40 bg-black px-4 py-3 text-white outline-none"
                  placeholder="0"
                />
              </Field>

              <p className="mt-3 text-xs text-white/50">
                Harga final merupakan harga jual yang sudah termasuk profit. Profit dipakai untuk laporan internal/admin.
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/admin/produk")}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      {children}
    </label>
  )
}
