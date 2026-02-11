'use client'

import { useEffect, useState } from "react";

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  initialData = null
}) {
  const [form, setForm] = useState({
    category_id: 1,
    subcategory_id: 1,
    name: "",
    type: "ACCOUNT_CREDENTIAL",
    duration_days: 7,
    description: "",
    member_price: "",
    reseller_price: "",
    is_active: true,
    is_published: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        category_id: initialData.category_id,
        subcategory_id: initialData.subcategory_id,
        name: initialData.name,
        type: initialData.type,
        duration_days: initialData.duration_days,
        description: initialData.description,
        member_price: initialData.tier_pricing.member,
        reseller_price: initialData.tier_pricing.reseller,
        is_active: initialData.is_active,
        is_published: initialData.is_published,
      });
    }
  }, [initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      category_id: form.category_id,
      subcategory_id: form.subcategory_id,
      name: form.name,
      type: form.type,
      duration_days: Number(form.duration_days),
      description: form.description,
      tier_pricing: {
        member: Number(form.member_price),
        reseller: Number(form.reseller_price),
      },
      is_active: form.is_active,
      is_published: form.is_published,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-purple-500/60 bg-black p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {initialData ? "Edit Produk" : "Tambah Produk"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Nama produk"
            value={form.name}
            onChange={handleChange}
            required
            className="input"
          />

          <textarea
            name="description"
            placeholder="Deskripsi"
            value={form.description}
            onChange={handleChange}
            className="input"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              name="duration_days"
              placeholder="Durasi (hari)"
              value={form.duration_days}
              onChange={handleChange}
              className="input"
            />

            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="input"
            >
              <option value="ACCOUNT_CREDENTIAL">Account Credential</option>
              <option value="VOUCHER">Voucher</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              name="member_price"
              placeholder="Harga member"
              value={form.member_price}
              onChange={handleChange}
              className="input"
            />
            <input
              type="number"
              name="reseller_price"
              placeholder="Harga reseller"
              value={form.reseller_price}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="flex gap-4 text-sm text-purple-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Aktif
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
              />
              Publish
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-add">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
