"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DataTransaksiPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [page, status]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const token = Cookies.get("token");
      if (!token) return;

      let url = `${API}/api/v1/admin/orders?page=${page}`;

      if (status) url += `&status=${status}`;
      if (search) url += `&invoice_number=${search}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();

      if (json.success) {
        const paginated = json.data;
        setOrders(paginated.data || []);
        setLastPage(paginated.last_page || 1);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  return (
    <section className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Data Transaksi</h1>

      {/* ================= FILTER ================= */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
          placeholder="Cari Invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="bg-zinc-900 border border-purple-700 rounded-lg px-4 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm"
        >
          Search
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="border border-purple-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#14002a] border-b border-purple-700">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Total Item</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Tanggal</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-400">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">
                  Tidak ada transaksi
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const totalItems =
                  order.items?.reduce(
                    (sum, item) => sum + (item.qty || 1),
                    0
                  ) || 0;

                return (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-800 hover:bg-purple-900/20 transition"
                  >
                    <td className="p-3">{order.id}</td>
                    <td className="p-3 font-medium">
                      {order.invoice_number || "-"}
                    </td>
                    <td className="p-3">
                      {order.user?.email || "-"}
                    </td>
                    <td className="p-3">{totalItems}</td>
                    <td className="p-3">
                      {order.payment?.gateway_code || "-"}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}
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
  );
}

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }) {
  const map = {
    paid: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    failed: "bg-red-500/20 text-red-400",
    refunded: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-zinc-700 text-white"
      }`}
    >
      {status || "-"}
    </span>
  );
}