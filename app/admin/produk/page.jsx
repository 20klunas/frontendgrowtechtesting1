'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { productService } from "../../services/productService";

export default function ProdukPage() {

  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // ================= LOAD DATA =================
  const loadProducts = async (customPage = page) => {
    setLoading(true);

    try {
      const res = await productService.getAll({
        search,
        page: customPage
      });

      setProducts(res.data || []);
      setMeta(res.meta || null);

    } catch (err) {
      alert("Gagal mengambil data");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProducts(1);
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [page]);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await productService.remove(id);
    loadProducts();
  };

  // ================= TOGGLE PUBLISH =================
  const togglePublish = async (id) => {
    await productService.publish(id);
    loadProducts();
  };

  // ================= SKELETON =================
  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-white/5">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-4 bg-purple-900/40 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );

  return (
    <motion.div
      className="
        rounded-2xl
        border border-purple-600/60
         bg-black
        p-6
        shadow-[0_0_25px_rgba(168,85,247,0.15)]
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          Manajemen Produk
        </h1>

        <button
          onClick={() => router.push("/admin/produk/tambah")}
          className="btn-add"
        >
          + Tambah Produk
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 mt-2">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="flex-1 h-10 rounded-lg bg-purple-900/40 px-4 text-white outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-purple-600/60 bg-black p-6 mt-2">

        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 text-left">Nama</th>
              <th className="py-3 text-left">Durasi</th>
              <th className="py-3 text-left">Harga Member</th>
              <th className="py-3 text-left">Harga Reseller</th>
              <th className="py-3 text-center">Status</th>
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
                <td colSpan="6" className="text-center py-6 text-purple-300">
                  Data kosong
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-white/5">

                  <td className="py-3 text-white">
                    {p.name}
                  </td>

                  <td className="py-3">
                    {p.duration_days} hari
                  </td>

                  <td className="py-3">
                    Rp {p.tier_pricing?.member?.toLocaleString()}
                  </td>

                  <td className="py-3">
                    Rp {p.tier_pricing?.reseller?.toLocaleString()}
                  </td>

                  <td className="py-3 text-center">
                    <button
                      onClick={() => togglePublish(p.id)}
                      className={
                        p.is_published
                          ? "badge-ready"
                          : "badge-danger"
                      }
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </button>
                  </td>

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
                  </td>

                </tr>
              ))
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
    </motion.div>
  );
}
