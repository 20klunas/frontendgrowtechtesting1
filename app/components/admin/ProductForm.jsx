'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductForm({ mode, id }) {

  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [form, setForm] = useState({
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
  });

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    const res = await fetch(
      `${API}/api/v1/admin/subcategories?category_id=${categoryId}`,
      { headers: authHeaders() }
    );

    const json = await res.json();
    setSubcategories(json.data || []);
  };


  const authHeaders = () => {
    const token = Cookies.get("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // ================= FETCH DATA =================
  const fetchInitial = async () => {

    const catRes = await fetch(`${API}/api/v1/admin/categories`, {
      headers: authHeaders(),
    });
    const catJson = await catRes.json();
    setCategories(catJson.data || []);

    if (mode === "edit") {
      const res = await fetch(`${API}/api/v1/admin/products/${id}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      fetchSubcategories(data.category_id);

      const data = json.data;

      setForm({
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        name: data.name,
        type: data.type,
        duration_days: data.duration_days,
        description: data.description,
        member_price: data.tier_pricing.member,
        reseller_price: data.tier_pricing.reseller,
        vip_price: data.tier_pricing.vip,
        is_active: data.is_active,
        is_published: data.is_published,
      });
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue = type === "checkbox" ? checked : value;

    setForm(prev => ({
      ...prev,
      [name]: newValue,
      ...(name === "category_id" && { subcategory_id: "" }) // reset subcategory
    }));

    if (name === "category_id") {
      fetchSubcategories(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      category_id: Number(form.category_id),
      subcategory_id: Number(form.subcategory_id),
      name: form.name,
      type: form.type,
      duration_days: Number(form.duration_days),
      description: form.description,
      tier_pricing: {
        member: Number(form.member_price),
        reseller: Number(form.reseller_price),
        vip: Number(form.vip_price),
      },
      is_active: form.is_active,
      is_published: form.is_published,
    };

    const url =
      mode === "edit"
        ? `${API}/api/v1/admin/products/${id}`
        : `${API}/api/v1/admin/products`;

    const method = mode === "edit" ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    router.push("/admin/produk");
  };

  return (
    <div className="max-w-2xl mx-auto bg-black p-6 rounded-2xl border border-purple-600/60">
      <h1 className="text-2xl font-bold text-white mb-6">
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
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          name="subcategory_id"
          value={form.subcategory_id}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Pilih Subkategori</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
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
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            name="member_price"
            placeholder="Harga Member"
            value={form.member_price}
            onChange={handleChange}
            className="input"
          />

          <input
            type="number"
            name="reseller_price"
            placeholder="Harga Reseller"
            value={form.reseller_price}
            onChange={handleChange}
            className="input"
          />
          <input
            type="number"
            name="vip_price"
            placeholder="Harga VIP"
            value={form.vip_price}
            onChange={handleChange}
            className="input"
          />
        </div>

        <button className="btn-add w-full">
          Simpan
        </button>
      </form>
    </div>
  );
}
