"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import PermissionGate from "../../components/admin/PermissionGate";

const API = process.env.NEXT_PUBLIC_API_URL;
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

export default function DataTransaksiPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filters, setFilters] = useState({
    invoice: "",
    status: "",
    payment_reference: "",
    product: "",
    category: "",
    date_from: "",
    date_to: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    invoice: "",
    status: "",
    payment_reference: "",
    product: "",
    category: "",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      if (!token) return;

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "10");

      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const res = await fetch(`${API}/api/v1/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (json.success) {
        const paginated = json.data || {};
        setOrders(Array.isArray(paginated.data) ? paginated.data : []);
        setLastPage(Number(paginated.last_page || 1));
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleResetFilter = () => {
    const empty = {
      invoice: "",
      status: "",
      payment_reference: "",
      product: "",
      category: "",
      date_from: "",
      date_to: "",
    };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  return (
    <PermissionGate permission="manage_orders">
      <section className="p-4 md:p-8 text-white space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Transaksi</h1>
          <p className="text-sm text-zinc-400">
            Menampilkan invoice, payment reference, harga, detail key/license, dan waktu transaksi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
          <input
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            placeholder="Cari invoice"
            value={filters.invoice}
            onChange={(e) => setFilters((prev) => ({ ...prev, invoice: e.target.value }))}
          />

          <select
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status || "all"} value={status}>
                {status ? status.toUpperCase() : "Semua Status"}
              </option>
            ))}
          </select>

          <input
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            placeholder="Payment reference"
            value={filters.payment_reference}
            onChange={(e) => setFilters((prev) => ({ ...prev, payment_reference: e.target.value }))}
          />

          <input
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            placeholder="Produk"
            value={filters.product}
            onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
          />

          <input
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            placeholder="Kategori"
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          />

          <input
            type="date"
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            value={filters.date_from}
            onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
          />

          <input
            type="date"
            className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
            value={filters.date_to}
            onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleApplyFilter} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm">
            Terapkan Filter
          </button>
          <button onClick={handleResetFilter} className="border border-purple-700 px-4 py-2 rounded-lg text-sm">
            Reset Filter
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="border border-purple-700 rounded-xl p-6 text-center text-zinc-400">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="border border-purple-700 rounded-xl p-6 text-center text-zinc-500">Tidak ada transaksi</div>
          ) : (
            orders.map((order) => {
              const items = Array.isArray(order?.item_details) ? order.item_details : [];
              const licenses = Array.isArray(order?.license_details) ? order.license_details : [];

              return (
                <div key={order.id} className="border border-purple-700 rounded-2xl p-5 bg-[#08010f]">
                  <div className="grid gap-4 lg:grid-cols-4">
                    <Info label="Invoice" value={order.invoice_number || "-"} bold />
                    <Info label="Payment Reference" value={order.payment_reference || "-"} />
                    <Info label="Harga" value={formatRupiah(order.amount || 0)} />
                    <Info label="Waktu" value={formatDateTime(order.transaction_datetime || order.created_at)} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-4 mt-4">
                    <Info label="User" value={order.user?.email || order.user?.name || "-"} />
                    <Info label="Gateway" value={order.payment?.gateway_code || "-"} />
                    <Info label="Status" value={<StatusBadge status={order.status} />} />
                    <Info label="Total Item" value={order.total_item_qty || 0} />
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-purple-800/60 p-4 bg-black/30">
                      <h3 className="font-semibold mb-3 text-purple-200">Detail Produk</h3>
                      {items.length === 0 ? (
                        <p className="text-sm text-zinc-500">Belum ada detail item.</p>
                      ) : (
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={`${order.id}-item-${index}`} className="rounded-lg border border-zinc-800 p-3">
                              <div className="font-medium text-white">{item.product || "Produk"}</div>
                              <div className="text-sm text-zinc-400">Kategori: {item.category || "-"}</div>
                              <div className="text-sm text-zinc-400">Subkategori: {item.subcategory || "-"}</div>
                              <div className="text-sm text-zinc-400">Qty: {item.qty || 0}</div>
                              <div className="text-sm text-zinc-400">Harga satuan: {formatRupiah(item.unit_price || 0)}</div>
                              <div className="text-sm text-zinc-300">Subtotal: {formatRupiah(item.line_subtotal || 0)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-purple-800/60 p-4 bg-black/30">
                      <h3 className="font-semibold mb-3 text-purple-200">Detail Key / License</h3>
                      {licenses.length === 0 ? (
                        <p className="text-sm text-zinc-500">Belum ada data delivery/license.</p>
                      ) : (
                        <div className="space-y-3">
                          {licenses.map((license, index) => (
                            <div key={`${order.id}-license-${index}`} className="rounded-lg border border-zinc-800 p-3">
                              <div className="text-sm text-zinc-400">Delivery mode: {license.delivery_mode || "-"}</div>
                              <div className="text-sm text-zinc-300 break-all">License key: {license.license_key || "-"}</div>
                              <div className="text-sm text-zinc-400">Data lain: {license.data_other || "-"}</div>
                              <div className="text-sm text-zinc-400">Note: {license.note || "-"}</div>
                              <div className="text-sm text-zinc-400">Status: {license.status || "-"}</div>
                              <div className="text-sm text-zinc-400">Sold at: {formatDateTime(license.sold_at)}</div>
                              <div className="text-sm text-zinc-400">Emailed at: {formatDateTime(license.emailed_at)}</div>
                              <div className="text-sm text-zinc-400">Revealed at: {formatDateTime(license.revealed_at)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-4 py-2 rounded-lg border border-purple-700 disabled:opacity-40"
          >
            {"<"}
          </button>

          <span className="px-4 py-2">
            {page} / {lastPage}
          </span>

          <button
            disabled={page === lastPage}
            onClick={() => setPage((p) => Math.min(p + 1, lastPage))}
            className="px-4 py-2 rounded-lg border border-purple-700 disabled:opacity-40"
          >
            {">"}
          </button>
        </div>
      </section>
    </PermissionGate>
  );
}

function Info({ label, value, bold = false }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <div className={bold ? "font-semibold text-white" : "text-zinc-200"}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    paid: "bg-green-500/20 text-green-400",
    fulfilled: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    created: "bg-sky-500/20 text-sky-400",
    cancelled: "bg-red-500/20 text-red-400",
    failed: "bg-rose-500/20 text-rose-400",
    expired: "bg-orange-500/20 text-orange-400",
    refunded: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-zinc-700 text-white"}`}>
      {status || "-"}
    </span>
  );
}
