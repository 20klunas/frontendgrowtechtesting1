'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { licenseService } from "../../../../services/licenseService";

export default function LicensesPage() {
  const { id } = useParams();

  const [licenses, setLicenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [qty, setQty] = useState(1);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await licenseService.getByProduct(id);
      const sum = await licenseService.getSummary(id);

      setLicenses(res.data || []);
      setSummary(sum.data?.counts || null);

    } catch {
      showToast("error", "Gagal load licenses");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= TAKE STOCK =================
  const handleTakeStock = async () => {
    try {
      const res = await licenseService.takeStock(id, qty);

      const blob = new Blob(
        [res.data.licenses.join("\n")],
        { type: "text/plain" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `licenses-product-${id}.txt`;
      a.click();

      showToast("success", `Berhasil mengambil ${qty} license`);

      loadData();

    } catch {
      showToast("error", "Gagal take stock");
    }
  };

  const SkeletonRow = () => (
    <tr className="border-b border-white/5">
      {[...Array(3)].map((_, i) => (
        <td key={i} className="py-3">
          <div className="h-4 rounded shimmer"></div>
        </td>
      ))}
    </tr>
  );

  return (
    <motion.div
      className="rounded-2xl border border-purple-600/60 bg-black p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 px-4 py-2 rounded-lg text-sm z-50 ${
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">
          Licenses Produk #{id}
        </h1>

        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm"
        >
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {Object.entries(summary).map(([key, val]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-purple-900/30 p-3 text-center border border-purple-500/20"
            >
              <p className="text-xs text-gray-400 capitalize">{key}</p>
              <p className="text-lg text-white font-bold">{val}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* TAKE STOCK */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-24 h-10 rounded-lg bg-purple-900/40 px-3 text-white outline-none"
        />

        <button
          onClick={handleTakeStock}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm"
        >
          Take Stock
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-purple-600/40 overflow-hidden">
        <table className="w-full text-sm text-gray-300">
          <thead className="bg-purple-900/30">
            <tr className="border-b border-white/10">
              <th className="py-3">License Key</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-6 text-purple-300">
                  Tidak ada license
                </td>
              </tr>
            ) : (
              licenses.map(l => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="py-2 text-white">{l.license_key}</td>
                  <td>{l.status}</td>
                  <td>{l.note || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SHIMMER STYLE */}
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
