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
  is_active: true,
  is_published: false,
}

export default function ProductForm({ mode, id }) {
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)
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
            subcategory_id: String(product.subcategory_id || ""),
            name: product.name || "",
            type: product.type || "ACCOUNT_CREDENTIAL",
            duration_days: product.duration_days ?? 7,
            description: product.description || "",
            member_price: product.tier_pricing?.member ?? "",
            reseller_price: product.tier_pricing?.reseller ?? "",
            vip_price: product.tier_pricing?.vip ?? "",
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        category_id: Number(form.category_id),
        subcategory_id: Number(form.subcategory_id),
        name: form.name,
        type: form.type,
        duration_days: Number(form.duration_days || 0) || null,
        description: form.description,
        tier_pricing: {
          member: Number(form.member_price || 0),
          reseller: Number(form.reseller_price || 0),
          vip: Number(form.vip_price || 0),
        },
        is_active: Boolean(form.is_active),
        is_published: Boolean(form.is_published),
      }

      const url =
        mode === "edit"
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

      router.push("/admin/produk")
    } catch (error) {
      console.error(error)
      alert(error.message || "Gagal menyimpan produk")
    }
  }

  if (loading) {
    return <p className="text-white">Loading...</p>
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-purple-600/60 bg-black p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">
        {mode === "edit" ? "Edit Produk" : "Tambah Produk"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Pilih Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          name="subcategory_id"
          value={form.subcategory_id}
          onChange={handleChange}
          className="input"
          required
          disabled={!form.category_id || subLoading}
        >
          <option value="">
            {!form.category_id
              ? "Pilih kategori terlebih dahulu"
              : subLoading
              ? "Memuat subkategori..."
              : "Pilih Subkategori"}
          </option>
          {filteredSubcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>

        <input
          name="name"
          placeholder="Nama Produk"
          value={form.name}
          onChange={handleChange}
          className="input"
          required
        />

        <textarea
          name="description"
          placeholder="Deskripsi"
          value={form.description}
          onChange={handleChange}
          className="input"
        />

        <input
          type="number"
          name="duration_days"
          placeholder="Durasi (hari)"
          value={form.duration_days}
          onChange={handleChange}
          className="input"
          min="1"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="number"
            name="member_price"
            placeholder="Harga Member"
            value={form.member_price}
            onChange={handleChange}
            className="input"
            min="0"
          />
          <input
            type="number"
            name="reseller_price"
            placeholder="Harga Reseller"
            value={form.reseller_price}
            onChange={handleChange}
            className="input"
            min="0"
          />
          <input
            type="number"
            name="vip_price"
            placeholder="Harga VIP"
            value={form.vip_price}
            onChange={handleChange}
            className="input"
            min="0"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          Produk aktif
        </label>

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />
          Produk dipublish
        </label>

        <button className="btn-add w-full">Simpan</button>
      </form>
    </div>
  )
}
