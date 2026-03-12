'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "../../services/productService";
import PermissionGate from "../../components/admin/PermissionGate";
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

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    duration_days: 7,
    member_price: "",
    reseller_price: "",
    vip_price: "",
  });

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
  const togglePublish = async (id, state) => {
    try {
      setProcessingId(id);

      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, is_published: !state }
            : p
        )
      );

      await productService.publish(id, !state);

      showToast("success", "Publish status diperbarui");

    } catch {
      loadProducts();
      showToast("error", "Gagal publish produk");
    }

    setProcessingId(null);
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

          const text = await res.text();   // 👈 penting

          console.log("SUMMARY RAW:", p.id, text);

          try {
            const json = JSON.parse(text);
            summaries[p.id] = json.data?.counts ?? null;
          } catch (err) {
            console.error("JSON PARSE ERROR:", p.id);
            summaries[p.id] = null;
          }
        })
      );

      setLicenseSummary(summaries);

    } catch (err) {
      console.error("Summary error", err);
    }
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);

    setEditForm({
      name: product.name,
      duration_days: product.duration_days,
      member_price: product.tier_pricing?.member
        ? formatRupiah(product.tier_pricing.member.toString())
        : "",
      reseller_price: product.tier_pricing?.reseller
        ? formatRupiah(product.tier_pricing.reseller.toString())
        : "",
      vip_price: product.tier_pricing?.vip
        ? formatRupiah(product.tier_pricing.vip.toString())
        : "",
    });

    setShowEditModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    const id = selectedProduct.id;
    const prev = products;

    try {
      setIsDeleting(true);

      setProducts(prev => prev.filter(p => p.id !== id));

      await productService.remove(id);

      showToast("success", "Produk berhasil dihapus");

    } catch {
      setProducts(prev);
      showToast("error", "Gagal menghapus produk");
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  const handleEditSubmit = async () => {
    if (!selectedProduct) return;

    try {
      setIsSaving(true);

      await productService.update(selectedProduct.id, {
        name: editForm.name,
        duration_days: Number(editForm.duration_days),
        tier_pricing: {
          member: parseRupiah(editForm.member_price),
          reseller: parseRupiah(editForm.reseller_price),
          vip: parseRupiah(editForm.vip_price),
        }
      });

      showToast("success", "Produk berhasil diupdate");
      setShowEditModal(false);
      loadProducts();

    } catch {
      showToast("error", "Gagal update produk");
    }

    setIsSaving(false);
  };

  const formatRupiah = (value) => {
    if (value === null || value === undefined) return "";

    const number = value.toString().replace(/\D/g, "");
    return new Intl.NumberFormat("id-ID").format(number);
  };

  const parseRupiah = (value) => {
    return Number(value.replace(/\D/g, ""));
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
        setShowEditModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <PermissionGate permission="manage_products">
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
        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block rounded-2xl border border-purple-600/60 bg-black p-6 mt-4">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 text-center">Nama</th>
                  <th className="py-3 text-center">Durasi</th>
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
                        <td className="py-3 text-white text-center">{p.name}</td>
                        <td className="py-3 text-center">{p.duration_days} hari</td>

                        <td className="py-3 text-center">
                          Rp {p.tier_pricing?.member
                            ? formatRupiah(p.tier_pricing.member)
                            : "-"}
                        </td>

                        <td className="py-3 text-center">
                          Rp {p.tier_pricing?.reseller
                            ? formatRupiah(p.tier_pricing.reseller)
                            : "-"}
                        </td>

                        <td className="py-3 text-center">
                          Rp {p.tier_pricing?.vip
                            ? formatRupiah(p.tier_pricing.vip)
                            : "-"}
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
                            disabled={processingId === p.id}
                            onClick={() => togglePublish(p.id, p.is_published)}
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
                            onClick={() => openEditModal(p)}
                            className="btn-edit-sm"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => openDeleteModal(p)}
                            className="btn-delete-sm"
                          >
                            Hapus
                          </button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 260, damping: 18 }}
                            onClick={() =>
                              router.push(`/admin/produk/${p.id}/licenses`)
                            }
                            className="btn-purple-solid"
                          >
                            Data Key
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION DESKTOP */}
          {!loading && meta?.last_page && (
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

        {/* ================= MOBILE CARD VIEW ================= */}
        <div className="md:hidden space-y-4 mt-4">
          {loading ? (
            <>
              <div className="h-28 rounded-xl bg-purple-900/20 animate-pulse" />
              <div className="h-28 rounded-xl bg-purple-900/20 animate-pulse" />
            </>
          ) : products.length === 0 ? (
            <div className="text-center text-purple-300 py-6">
              Data kosong
            </div>
          ) : (
            <>
              {products.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-purple-600/40 bg-gradient-to-b from-purple-950/40 to-black p-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold text-base">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {p.duration_days} hari
                      </p>
                    </div>

                    <button
                      onClick={() => toggleActive(p.id, p.is_active)}
                      className={`text-xs px-3 py-1 rounded-full ${
                        p.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {p.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>

                  {/* PRICE */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div className="bg-purple-900/30 p-2 rounded-lg text-center">
                      <p className="text-gray-400">Member</p>
                      <p className="text-white font-semibold">
                        Rp {formatRupiah(p.tier_pricing?.member)}
                      </p>
                    </div>

                    <div className="bg-purple-900/30 p-2 rounded-lg text-center">
                      <p className="text-gray-400">Reseller</p>
                      <p className="text-white font-semibold">
                        Rp {formatRupiah(p.tier_pricing?.reseller)}
                      </p>
                    </div>

                    <div className="bg-purple-900/30 p-2 rounded-lg text-center">
                      <p className="text-gray-400">VIP</p>
                      <p className="text-white font-semibold">
                        Rp {formatRupiah(p.tier_pricing?.vip)}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() =>
                        router.push(`/admin/produk/${p.id}/licenses`)
                      }
                      className="w-full text-xs py-2 rounded-lg bg-purple-600 text-white font-medium"
                    >
                      Data Key
                    </button>

                    <div className="flex justify-between gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="flex-1 text-xs py-2 rounded-lg bg-purple-600/20 text-purple-300"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => openDeleteModal(p)}
                        className="flex-1 text-xs py-2 rounded-lg bg-red-600/20 text-red-400"
                      >
                        Hapus
                      </button>
                    </div>

                    <button
                      onClick={() => togglePublish(p.id, p.is_published)}
                      className={`w-full text-xs py-2 rounded-lg ${
                        p.is_published
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {p.is_published ? "Licensed" : "Draft"}
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* PAGINATION MOBILE */}
              {!loading && meta?.last_page && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: meta.last_page }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 text-xs rounded ${
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
            </>
          )}
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            >

              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="modal-card rounded-2xl p-8 w-[420px] shadow-[0_0_45px_rgba(168,85,247,0.35)]"
              >

                {/* ICON */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-3xl">
                  ✖
                </div>

                {/* TITLE */}
                <h2 className="modal-title text-xl font-semibold text-center">
                  Hapus Produk
                </h2>

                {/* DESCRIPTION */}
                <p className="modal-text text-sm text-center mt-2 mb-6">
                  Produk{" "}
                  <span className="font-semibold text-purple-500">
                    {selectedProduct?.name}
                  </span>{" "}
                  akan dihapus permanen
                </p>

                {/* BUTTON */}
                <div className="flex justify-center gap-3">

                  <button
                    disabled={isDeleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary disabled:opacity-40"
                  >
                    Batal
                  </button>

                  <button
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="btn-danger disabled:opacity-40 flex items-center gap-2"
                  >
                    {isDeleting && <Spinner />}
                    {isDeleting ? "Menghapus..." : "Hapus"}
                  </button>

                </div>

              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* EDIT MODAL */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setShowEditModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="modal-card w-full max-w-xl rounded-2xl shadow-[0_0_45px_rgba(168,85,247,0.25)] overflow-hidden"
              >

                {/* HEADER */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-purple-800/30">

                  <div>
                    <h2 className="modal-title text-lg font-semibold">
                      Edit Produk
                    </h2>

                    <p className="modal-text text-xs mt-1">
                      Perbarui informasi produk dan harga paket
                    </p>
                  </div>

                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-red-400 transition"
                  >
                    ✕
                  </button>

                </div>

                {/* BODY */}
                <div className="px-6 py-6 space-y-6">

                  {/* PRODUCT INFO */}
                  <div className="space-y-4">

                    <div>
                      <label className="modal-text text-sm mb-1 block">
                        Nama Produk
                      </label>

                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="input-primary"
                        placeholder="Contoh: Netflix Premium"
                      />
                    </div>

                    <div>
                      <label className="modal-text text-sm mb-1 block">
                        Durasi Paket
                      </label>

                      <input
                        type="number"
                        value={editForm.duration_days}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            duration_days: e.target.value
                          })
                        }
                        className="input-primary"
                        placeholder="Jumlah hari"
                      />

                      <p className="modal-text text-xs mt-1">
                        Contoh: 30 hari, 90 hari, atau 365 hari
                      </p>
                    </div>

                  </div>


                  {/* PRICE SECTION */}
                  <div>

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="modal-title text-sm font-semibold">
                        Harga Paket
                      </h3>

                      <span className="modal-text text-xs">
                        Format Rupiah
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">

                      {[
                        { key: "member_price", label: "Member" },
                        { key: "reseller_price", label: "Reseller" },
                        { key: "vip_price", label: "VIP" }
                      ].map((price) => (

                        <div key={price.key} className="space-y-1">

                          <label className="modal-text text-xs">
                            {price.label}
                          </label>

                          <div className="relative">

                            <span className="absolute left-3 top-2 text-gray-500 text-sm">
                              Rp
                            </span>

                            <input
                              value={editForm[price.key]}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  [price.key]: formatRupiah(e.target.value)
                                })
                              }
                              className="input-primary pl-10"
                              placeholder="0"
                            />

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>


                {/* FOOTER */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-purple-800/30">

                  <p className="modal-text text-xs">
                    Pastikan harga sesuai dengan paket produk
                  </p>

                  <div className="flex gap-3">

                    <button
                      disabled={isSaving}
                      onClick={() => setShowEditModal(false)}
                      className="btn-secondary disabled:opacity-40"
                    >
                      Batal
                    </button>

                    <button
                      disabled={isSaving}
                      onClick={handleEditSubmit}
                      className="btn-primary disabled:opacity-40 flex items-center gap-2"
                    >
                      {isSaving && <Spinner />}
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </button>

                  </div>

                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
    </PermissionGate>  
  );
}
