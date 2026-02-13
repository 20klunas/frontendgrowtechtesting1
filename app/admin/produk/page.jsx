'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "../../services/productService";

export default function ProdukPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const [toast, setToast] = useState(null);
  const [licenseSummary, setLicenseSummary] = useState({});

  // ================= TOAST =================
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  // ================= SEARCH DEBOUNCE =================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // ================= LOAD DATA =================
  const loadProducts = async (customPage = page) => {
    setLoading(true);
    try {
      const res = await productService.getAll({
        search: debouncedSearch,
        page: customPage
      });

      setProducts(res.data || []);
      setMeta(res.meta || null);

      loadLicenseSummary(res.data || []);


    } catch (err) {
      showToast("error", "Gagal mengambil data");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts(page);
  }, [debouncedSearch, page]);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return;

    const prev = products;

    try {
      // Optimistic remove
      setProducts(prevProducts =>
        prevProducts.filter(p => p.id !== id)
      );

      await productService.remove(id);

      showToast("success", "Produk berhasil dihapus");

    } catch (err) {
      setProducts(prev);
      showToast("error", "Gagal menghapus produk");
    }
  };

  // ================= TOGGLE ACTIVE =================
  const toggleActive = async (id, state) => {
    setProcessingId(id);

    try {
      setProducts(prev =>
        prev.map(p =>
          p.id === id ? { ...p, is_active: !state } : p
        )
      );

      await productService.toggleActive(id, state);

      showToast("success", "Status produk diperbarui");

    } catch {
      loadProducts();
      showToast("error", "Gagal update status");
    }

    setProcessingId(null);
  };

  // ================= TOGGLE PUBLISH =================
  const togglePublish = async (id) => {
    try {
      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, is_published: !p.is_published }
            : p
        )
      );

      await productService.publish(id);

      showToast("success", "Publish status diperbarui");

    } catch {
      loadProducts();
      showToast("error", "Gagal publish produk");
    }
  };

  // ================= SKELETON =================
  const SkeletonRow = () => (
    <tr className="border-b border-white/5">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-4 rounded shimmer"></div>
        </td>
      ))}
    </tr>
  );

  const loadLicenseSummary = async (products) => {
    try {
      const summaries = {};

      await Promise.all(
        products.map(async (p) => {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/products/${p.id}/licenses/summary`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            }
          );

          const json = await res.json();
          summaries[p.id] = json.data?.counts || null;
        })
      );

      setLicenseSummary(summaries);

    } catch (err) {
      console.error("Summary error", err);
    }
  };


  return (
    <motion.div
      className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 px-4 py-2 rounded-lg text-sm shadow-lg z-50 ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          Manajemen Produk
        </h1>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/admin/produk/tambah")}
          className="btn-add"
        >
          + Tambah Produk
        </motion.button>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 mt-4">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 rounded-lg bg-purple-900/40 px-4 text-white outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-purple-600/60 bg-black p-6 mt-4">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 text-center">Nama</th>
              <th className="py-3 text-center">Durasi</th>
              <th className="py-3 text-center">Stock</th>
              <th className="py-3 text-center">Harga Member</th>
              <th className="py-3 text-center">Harga Reseller</th>
              <th className="py-3 text-center">Harga VIP</th>
              <th className="py-3 text-center">Status</th>
              <th className="py-3 text-center">Terlisensi</th>
              <th className="py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-purple-300">
                  Data kosong
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {products.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{
                      backgroundColor: "rgba(168,85,247,0.08)"
                    }}
                    className="border-b border-white/5"
                  >
                    <td className="py-3 text-white">{p.name}</td>
                    <td className="py-3">{p.duration_days} hari</td>
                    <td className="py-3 text-center">
                      {licenseSummary[p.id] ? (
                        <div className="text-xs">
                          <p>Total: {licenseSummary[p.id].total}</p>
                          <p className="text-green-400">
                            Available: {licenseSummary[p.id].available}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3">
                      Rp {p.tier_pricing?.member?.toLocaleString() || "-"}
                    </td>
                    <td className="py-3">
                      Rp {p.tier_pricing?.reseller?.toLocaleString() || "-"}
                    </td>
                    <td className="py-3">
                      Rp {p.tier_pricing?.vip?.toLocaleString() || "-"}
                    </td>

                    {/* STATUS */}
                    <td className="py-3 text-center">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        disabled={processingId === p.id}
                        onClick={() => toggleActive(p.id, p.is_active)}
                        className={`${
                          p.is_active ? "badge-ready" : "badge-danger"
                        } ${processingId === p.id ? "opacity-50" : ""}`}
                      >
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </motion.button>
                    </td>

                    {/* PUBLISH */}
                    <td className="py-3 text-center">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => togglePublish(p.id)}
                        className={
                          p.is_published ? "badge-info" : "badge-warning"
                        }
                      >
                        {p.is_published ? "Licensed" : "Draft"}
                      </motion.button>
                    </td>

                    {/* AKSI */}
                    <td className="py-3 text-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/produk/${p.id}/edit`)}
                        className="btn-edit-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn-delete-sm"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => router.push(`/admin/produk/${p.id}/licenses`)}
                        className="btn-purple"
                      >
                        Data Key
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {!loading && meta && (
          <div className="flex justify-end gap-2 mt-6">
            {Array.from({ length: meta.last_page }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded ${
                  page === i + 1
                    ? "bg-purple-600 text-white"
                    : "bg-purple-900/40 text-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skeleton shimmer style */}
      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
          background: rgba(168, 85, 247, 0.15);
        }

        .shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          height: 100%;
          width: 150%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.25),
            transparent
          );
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          100% {
            left: 150%;
          }
        }
      `}</style>
    </motion.div>
  );
}
