'use client'

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productService } from "@/services/productService";
import { useRouter } from "next/navigation";

export default function ProdukPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data);
    } catch (err) {
      alert(err.message);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus produk?")) return;
    await productService.remove(id);
    loadProducts();
  };

  const handlePublish = async (id) => {
    await productService.publish(id);
    loadProducts();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-bold text-white">
        Manajemen Produk
      </h1>

      {/* DATA PRODUK */}
      <div className="rounded-2xl border border-purple-600/60 bg-black p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Data Produk
        </h2>

        {loading ? (
          <p className="text-purple-300">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Durasi</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 hover:bg-purple-900/20"
                  >
                    <td>{p.id}</td>
                    <td className="text-white font-medium">{p.name}</td>
                    <td>{p.duration_days} hari</td>
                    <td>{p.type}</td>
                    <td className="text-center">
                      {p.is_published ? (
                        <span className="badge-ready">PUBLISHED</span>
                      ) : (
                        <span className="badge-pending">DRAFT</span>
                      )}
                    </td>
                    <td className="space-x-2 text-center">
                      {!p.is_published && (
                        <button
                          onClick={() => handlePublish(p.id)}
                          className="btn-edit-sm"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn-delete-sm"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
