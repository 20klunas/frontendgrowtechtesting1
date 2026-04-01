"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ChangePasswordModal from "../../components/customer/ChangePasswordModal";
import { User, Mail, MapPin, Pencil, Filter, ReceiptText } from "lucide-react";
import { useAuth } from "../../../app/hooks/useAuth";
import { apiFetch } from "../../../app/lib/utils";

const STATUS_OPTIONS = ["", "created", "pending", "paid", "fulfilled", "cancelled", "failed", "expired", "refunded"];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status) {
  const map = {
    paid: "bg-green-500/15 text-green-400 border-green-500/30",
    fulfilled: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    created: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    expired: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    refunded: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };

  return map[String(status || "").toLowerCase()] || "bg-zinc-800 text-gray-200 border-zinc-700";
}

function normalizeOrderItems(order) {
  const summaryItems = Array.isArray(order?.history_summary?.items) ? order.history_summary.items : [];
  if (summaryItems.length > 0) return summaryItems;

  const itemDetails = Array.isArray(order?.item_details) ? order.item_details : [];
  if (itemDetails.length > 0) return itemDetails;

  const rawItems = Array.isArray(order?.items)
    ? order.items.map((item) => {
        const product = item?.product || {};
        const category = item?.category || product?.category || {};
        const subcategory = item?.subcategory || product?.subcategory || {};

        return {
          order_item_id: item?.id ?? null,
          product_id: item?.product_id ?? product?.id ?? null,
          product: item?.product_name || product?.name || order?.product?.name || "Produk",
          product_slug: item?.product_slug || product?.slug || order?.product?.slug || null,
          category: category?.name || order?.product?.category?.name || null,
          subcategory: subcategory?.name || order?.product?.subcategory?.name || null,
          qty: Number(item?.qty || 0),
          unit_price: Number(item?.unit_price || 0),
          line_subtotal: Number(item?.line_subtotal || 0),
        };
      })
    : [];

  if (rawItems.length > 0) return rawItems;

  if (order?.product) {
    return [
      {
        order_item_id: null,
        product_id: order.product?.id ?? null,
        product: order.product?.name || "Produk",
        product_slug: order.product?.slug || null,
        category: order.product?.category?.name || null,
        subcategory: order.product?.subcategory?.name || null,
        qty: Number(order?.qty || 0),
        unit_price: Number(order?.qty ? Number(order?.subtotal || order?.amount || 0) / Number(order.qty || 1) : order?.amount || 0),
        line_subtotal: Number(order?.subtotal || order?.amount || 0),
      },
    ];
  }

  return [];
}

function buildOrderHistorySummary(order) {
  const summary = order?.history_summary || {};
  const items = normalizeOrderItems(order);

  const categories = Array.from(
    new Set(
      [
        ...(Array.isArray(summary?.categories) ? summary.categories : []),
        ...items.map((item) => item?.category).filter(Boolean),
      ].filter(Boolean)
    )
  );

  return {
    invoice: summary?.invoice || order?.invoice_number || "-",
    waktu: summary?.waktu || order?.transaction_datetime || order?.created_at || null,
    harga: Number(summary?.harga || order?.amount || 0),
    total_item_qty: Number(summary?.total_item_qty || order?.total_item_qty || items.reduce((total, item) => total + Number(item?.qty || 0), 0)),
    categories,
    items,
  };
}

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    name: "",
    full_name: "",
    email: "",
    address: "",
    tier: "member",
  });

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState({ total: 0 });
  const [historyFilters, setHistoryFilters] = useState({
    status: "",
    date_from: "",
    date_to: "",
    invoice: "",
    category: "",
    product: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    date_from: "",
    date_to: "",
    invoice: "",
    category: "",
    product: "",
  });

  useEffect(() => {
    if (loading) return;

    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/v1/auth/me/profile", { method: "GET" });
        const data = res.data;

        const profileData = {
          name: data?.name || "",
          full_name: data?.full_name || "",
          email: data?.email || "",
          address: data?.address || "",
          tier: data?.tier || "member",
        };

        setForm(profileData);
        setInitialForm(profileData);
        setUser(data);
      } catch (err) {
        console.error("GET PROFILE ERROR:", err);
        alert(err?.message || "Gagal mengambil data profil");
      }
    };

    fetchProfile();
  }, [loading, setUser]);

  useEffect(() => {
    if (!avatarFile) return;

    const uploadAvatar = async () => {
      setUploadingAvatar(true);
      try {
        const signRes = await apiFetch("/api/v1/auth/me/avatar/sign", {
          method: "POST",
          body: JSON.stringify({ mime: avatarFile.type }),
        });

        const { path, signed_url, public_url } = signRes.data;

        const putRes = await fetch(signed_url, {
          method: "PUT",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });

        if (!putRes.ok) {
          const t = await putRes.text().catch(() => "");
          console.error("PUT SUPABASE FAILED:", putRes.status, t);
          throw new Error(`Upload ke Supabase gagal: HTTP ${putRes.status}`);
        }

        await apiFetch("/api/v1/auth/me/avatar", {
          method: "PATCH",
          body: JSON.stringify({
            avatar_path: path,
            avatar_url: public_url,
            avatar: public_url,
          }),
        });

        const profileRes = await apiFetch("/api/v1/auth/me/profile", {
          method: "GET",
        });

        setUser(profileRes.data);
        alert("Avatar berhasil diperbarui");
      } catch (err) {
        console.error("UPLOAD AVATAR ERROR:", err);
        alert(err?.message || "Gagal upload avatar");
      } finally {
        setUploadingAvatar(false);
        setAvatarFile(null);
      }
    };

    uploadAvatar();
  }, [avatarFile, setUser]);

  useEffect(() => {
    if (loading || !user) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(historyPage));
        params.set("per_page", "10");

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });

        const res = await apiFetch(`/api/v1/orders?${params.toString()}`, { method: "GET" });
        const paginated = res?.data || {};

        setHistoryItems(Array.isArray(paginated?.data) ? paginated.data : []);
        setHistoryPage(Number(paginated?.current_page || 1));
        setHistoryLastPage(Number(paginated?.last_page || 1));
        setHistoryMeta({ total: Number(paginated?.total || 0) });
      } catch (err) {
        console.error("GET HISTORY ERROR:", err);
        setHistoryItems([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [user, loading, historyPage, appliedFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const trimmed = value.slice(0, 10);
      setForm({ ...form, name: trimmed });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran maksimal 2MB");
      return;
    }

    setAvatarFile(file);
  };

  const isFilled = (value) => value && value.trim() !== "";
  const isChanged = (key) => initialForm && form[key] !== initialForm[key];

  const hasChanges =
    initialForm &&
    Object.keys(form).some((key) => form[key] !== initialForm[key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/v1/auth/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          full_name: form.full_name,
          address: form.address,
        }),
      });

      const data = res.data;

      const updated = {
        name: data?.name || "",
        full_name: data?.full_name || "",
        email: data?.email || "",
        address: data?.address || "",
        tier: data?.tier || form.tier || "member",
      };

      setForm(updated);
      setInitialForm(updated);
      setUser(data);

      alert("Profil berhasil diperbarui");
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      alert(err?.message || "Gagal update profil");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyFilter = () => {
    setHistoryPage(1);
    setAppliedFilters({ ...historyFilters });
  };

  const handleResetFilter = () => {
    const empty = {
      status: "",
      date_from: "",
      date_to: "",
      invoice: "",
      category: "",
      product: "",
    };
    setHistoryFilters(empty);
    setAppliedFilters(empty);
    setHistoryPage(1);
  };

  const avatarSrc = user?.avatar_url || user?.avatar || null;
  const appliedFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  if (loading) return null;
  if (!user) return <p className="text-white text-center">User tidak ditemukan</p>;

  return (
    <>
      <main className="min-h-screen bg-black px-4 pt-28 pb-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-56 h-56 rounded-3xl border-2 border-purple-500 overflow-hidden">
              <Image
                key={avatarSrc || "fallback"}
                src={avatarSrc ? `${avatarSrc}?t=${Date.now()}` : "/logoherosection.png"}
                alt="Profile"
                fill
                className="rounded-2xl object-cover"
                sizes="224px"
                priority
              />

              <input
                type="file"
                accept="image/*"
                hidden
                id="avatarInput"
                onChange={handleAvatarSelect}
              />

              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => document.getElementById("avatarInput")?.click()}
                className="absolute bottom-3 right-3 bg-purple-700 p-2 rounded-lg disabled:opacity-50"
              >
                {uploadingAvatar ? "..." : <Pencil size={16} className="text-white" />}
              </button>
            </div>
          </div>

          <div className="border border-purple-500/50 rounded-3xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Profil Akun</h2>

            <div className="space-y-5">
              <Input
                icon={<User />}
                label="Nama Pengguna"
                name="name"
                value={form.name}
                onChange={handleChange}
                filled={isFilled(form.name)}
                changed={isChanged("name")}
                maxLength={10}
              />

              <Input
                icon={<User />}
                label="Nama Lengkap"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                filled={isFilled(form.full_name)}
                changed={isChanged("full_name")}
              />

              <Input icon={<Mail />} label="Email" name="email" value={form.email} disabled filled />

              <Input
                icon={<MapPin />}
                label="Alamat"
                name="address"
                value={form.address}
                onChange={handleChange}
                filled={isFilled(form.address)}
                changed={isChanged("address")}
              />

              <div className="mt-6">
                <label className="flex items-center gap-2 text-sm text-purple-300 mb-2">🎖 Tier Akun</label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-purple-900/40 border border-purple-700 rounded-xl px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold w-fit ${
                      form.tier === "vip"
                        ? "bg-yellow-500 text-black"
                        : form.tier === "reseller"
                        ? "bg-blue-500"
                        : "bg-gray-600"
                    }`}
                  >
                    {String(form.tier || "member").toUpperCase()}
                  </span>

                  <a
                    href="https://discord.gg/YOUR_SERVER_LINK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                  >
                    Request Upgrade via Discord
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 flex-wrap">
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="border border-purple-500 px-6 py-2 rounded-xl text-white hover:bg-purple-500/10"
              >
                Ganti Password!
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-purple-700 px-6 py-2 rounded-xl text-white font-semibold hover:bg-purple-800 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>

          <section className="border border-purple-500/40 rounded-3xl p-6 lg:p-8 bg-[#06000d]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <ReceiptText className="w-6 h-6 text-purple-400" />
                  History Transaksi
                </h2>
                <p className="text-sm text-purple-200/80 mt-2">
                  Invoice, kategori, produk, harga, dan filter transaksi ada di sini.
                </p>
              </div>

              <div className="text-sm text-purple-300 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {historyMeta.total} transaksi • {appliedFilterCount} filter aktif
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 mb-5">
              <select
                className="rounded-xl bg-black border border-purple-700/50 px-4 py-3 text-white"
                value={historyFilters.status}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status || "all"} value={status}>
                    {status ? status.toUpperCase() : "Semua Status"}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="rounded-xl bg-black border border-purple-700/50 px-4 py-3 text-white"
                value={historyFilters.date_from}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, date_from: e.target.value }))}
              />

              <input
                type="date"
                className="rounded-xl bg-black border border-purple-700/50 px-4 py-3 text-white"
                value={historyFilters.date_to}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, date_to: e.target.value }))}
              />

              <input
                className="rounded-xl bg-black border border-purple-700/50 px-4 py-3 text-white placeholder:text-gray-500"
                placeholder="Cari invoice"
                value={historyFilters.invoice}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, invoice: e.target.value }))}
              />

              <input
                className="rounded-xl bg-black border border-purple-700/50 px-4 py-3 text-white placeholder:text-gray-500"
                placeholder="Cari kategori"
                value={historyFilters.category}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, category: e.target.value }))}
              />

              <input
                className="rounded-xl bg-black border border-purple-700/50 px-4 py-3 text-white placeholder:text-gray-500"
                placeholder="Cari produk"
                value={historyFilters.product}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, product: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={handleApplyFilter}
                className="bg-purple-700 hover:bg-purple-800 px-5 py-2.5 rounded-xl text-white font-medium"
              >
                Terapkan Filter
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="border border-purple-600 px-5 py-2.5 rounded-xl text-purple-200 hover:bg-purple-900/20"
              >
                Reset Filter
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-14 text-purple-200">Memuat history transaksi...</div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-14 text-gray-400 border border-dashed border-purple-800 rounded-2xl">
                Tidak ada transaksi yang cocok dengan filter.
              </div>
            ) : (
              <div className="space-y-4">
                {historyItems.map((order) => {
                  const summary = buildOrderHistorySummary(order);
                  const items = summary.items;
                  const categories = summary.categories;

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-purple-700/40 bg-black/60 p-5 lg:p-6"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs uppercase tracking-wide text-purple-300">Invoice</span>
                            <span className="text-white font-semibold">{summary.invoice}</span>
                          </div>
                          <div className="text-sm text-gray-300">Waktu: {formatDateTime(summary.waktu)}</div>
                          <div className="text-sm text-gray-300">Kategori: {categories.length ? categories.join(", ") : "-"}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>Status pembayaran:</span>
                            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusClasses(order.status)}`}>
                              {String(order.status || "-").toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="text-left lg:text-right space-y-2">
                          <div className="text-xs uppercase tracking-wide text-purple-300">Harga</div>
                          <div className="text-2xl font-bold text-white">{formatRupiah(summary.harga)}</div>
                          <div className="text-sm text-gray-400">Total item: {summary.total_item_qty || 0}</div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {items.length > 0 ? (
                          items.map((item, idx) => (
                            <div key={`${order.id}-${item.order_item_id || idx}`} className="rounded-xl border border-purple-800/50 bg-purple-950/20 p-4">
                              <div className="text-white font-medium">{item.product || "Produk"}</div>
                              <div className="text-sm text-gray-400 mt-1">Kategori: {item.category || "-"}</div>
                              <div className="text-sm text-gray-400">Subkategori: {item.subcategory || "-"}</div>
                              <div className="text-sm text-gray-400">Qty: {item.qty || 0}</div>
                              <div className="text-sm text-gray-400">Harga satuan: {formatRupiah(item.unit_price || 0)}</div>
                              <div className="text-sm text-gray-300 mt-1">Subtotal item: {formatRupiah(item.line_subtotal || 0)}</div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-purple-800/50 bg-purple-950/20 p-4 text-gray-400">
                            Detail item belum tersedia.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded-xl border border-purple-700 text-white disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-purple-200">
                Halaman {historyPage} / {historyLastPage}
              </span>
              <button
                type="button"
                disabled={historyPage >= historyLastPage}
                onClick={() => setHistoryPage((prev) => Math.min(historyLastPage, prev + 1))}
                className="px-4 py-2 rounded-xl border border-purple-700 text-white disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </section>
        </div>
      </main>

      <ChangePasswordModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}

function Input({
  icon,
  label,
  name,
  value,
  onChange,
  disabled = false,
  filled = false,
  changed = false,
  maxLength,
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-purple-300 mb-1">
        {icon} {label}
        {changed && <span className="text-xs text-purple-400">(diubah)</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={disabled ? "" : "Belum diisi"}
        className={`w-full rounded-xl px-4 py-2 outline-none text-white border ${
          filled ? "bg-purple-900/60 border-purple-500" : "bg-black border-purple-700/30 text-gray-400"
        } ${changed ? "ring-2 ring-purple-500/40" : ""} disabled:opacity-60`}
      />
    </div>
  );
}
