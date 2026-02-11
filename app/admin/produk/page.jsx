'use client'

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productService } from "../../services/productService";
import ProductModal from "../../components/admin/modal/ProductModal";

export default function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = async () => {
    const res = await productService.getAll();
    setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (payload) => {
    await productService.create(payload);
    setOpenModal(false);
    loadProducts();
  };

  const handleUpdate = async (payload) => {
    await productService.update(selectedProduct.id, payload);
    setSelectedProduct(null);
    setOpenModal(false);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await productService.remove(id);
    loadProducts();
  };

  return (
    <motion.div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Manajemen Produk</h1>
        <button
          onClick={() => {
            setSelectedProduct(null);
            setOpenModal(true);
          }}
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
              <tr>
                <th>Nama</th>
                <th>Durasi</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/10">
                  <td className="text-white">{p.name}</td>
                  <td>{p.duration_days} hari</td>
                  <td>Rp {p.tier_pricing.member}</td>
                  <td>{p.is_published ? "Published" : "Draft"}</td>
                  <td className="space-x-2">
                    <button
                      className="btn-edit-sm"
                      onClick={() => {
                        setSelectedProduct(p);
                        setOpenModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete-sm"
                      onClick={() => handleDelete(p.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedProduct}
        onSubmit={selectedProduct ? handleUpdate : handleCreate}
      />
    </motion.div>
  );
}
