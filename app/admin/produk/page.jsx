'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { productService } from "@/services/productService";

export default function ProdukPage() {

  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data || []);
    } catch (err) {
      alert("Gagal mengambil data");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await productService.remove(id);
    loadProducts();
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
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

      <div className="rounded-2xl border border-purple-600/60 bg-black p-6">

        {loading ? (
          <p className="text-purple-300">Loading...</p>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="border-b border-white/10">
                <th>Nama</th>
                <th>Durasi</th>
                <th>Harga Member</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="text-white">{p.name}</td>
                  <td>{p.duration_days} hari</td>
                  <td>Rp {p.tier_pricing?.member}</td>
                  <td>
                    {p.is_published ? (
                      <span className="badge-ready">Published</span>
                    ) : (
                      <span className="badge-danger">Draft</span>
                    )}
                  </td>
                  <td className="space-x-2">
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
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-purple-300">
                    Data kosong
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

      </div>
    </motion.div>
  );
}
