'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { licenseService } from "../../../../services/licenseService";
import * as XLSX from "xlsx";

export default function LicensesPage() {
  const { id } = useParams();
  const [productName, setProductName] = useState("");

  const [licenses, setLicenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [qty, setQty] = useState(1);

  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const [licenseKey, setLicenseKey] = useState("");
  const [note, setNote] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [proofs, setProofs] = useState([]);
  const [showProofModal, setShowProofModal] = useState(false);


  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, sum, proofRes] = await Promise.all([
        licenseService.getByProduct(id),
        licenseService.getSummary(id),
        licenseService.proofList()
      ]);

      setLicenses(res.data?.data || []);
      setProductName(res.data?.product?.name || "Produk");
      setSummary(sum.data?.counts || null);
      setProofs(proofRes.data?.data || []);

    } catch (err) {
      console.error(err);
      showToast("error", err.message);
    }
    setLoading(false);
  };




  useEffect(() => {
    if (id) loadData();
  }, [id]);


  // ================= SINGLE INSERT =================
  const handleSingleInsert = async () => {
    if (!licenseKey) {
      showToast("error", "License key wajib diisi");
      return;
    }

    try {
        await licenseService.createSingle(id, {
            license_key: licenseKey,
            data_other: null,
            note
        });

      showToast("success", "License berhasil ditambahkan");
      setShowSingleModal(false);
      setLicenseKey("");
      setNote("");
      loadData();

    } catch {
      showToast("error", "Gagal tambah license");
    }
  };

  // ================= BULK UPLOAD =================
  const handleBulkUpload = async () => {
    if (!bulkText) {
      showToast("error", "Bulk text kosong");
      return;
    }

    try {
      const res = await licenseService.uploadBulk(id, bulkText);

      showToast(
        "success",
        `Masuk: ${res.data.inserted}, Duplikat: ${res.data.duplicate}`
      );

      setShowBulkModal(false);
      setBulkText("");
      loadData();

    } catch {
      showToast("error", err.message);
    }
  };

  // ================= CHECK DUPLICATES =================
  const handleCheckDuplicate = async () => {
    if (!bulkText.trim()) {
        showToast("error", "Isi bulk text dulu");
        return;
    }

    try {
        const res = await licenseService.checkDuplicates(id, bulkText);

        console.log("DUPLICATE RESULT:", res);

        const total = res.data?.total_lines ?? 0;
        const duplicates = res.data?.duplicates ?? 0;
        const newItems = total - duplicates;

        showToast(
        "success",
        `Baru: ${newItems}, Duplikat: ${duplicates}`
        );

    } catch (err) {
        showToast("error", err.message);
    }
  };



  // ================= TAKE STOCK =================
  const handleTakeStock = async () => {
    try {

        if (qty <= 0) {
        showToast("error", "Qty harus lebih dari 0");
        return;
        }

        if (qty > (summary?.available ?? 0)) {
        showToast("error", "Qty melebihi stok available");
        return;
        }

        const res = await licenseService.takeStock(id, qty);

        console.log("TAKE STOCK RESPONSE:", res);

        const licenses =
          res?.data?.items ||
          res?.data?.data?.items ||
          [];

        console.log("LICENSES RESULT:", licenses);

        if (!licenses.length) {
        showToast(
            "error",
            res?.data?.message || "Tidak ada license dikembalikan backend"
        );
        return;
        }

        const worksheetData = licenses.map((item, index) => ({
          No: index + 1,
          License_Key: item.license_key,
          Data_Other: item.data_other ?? "",
          Note: item.note ?? "",
          Taken_At: new Date().toLocaleString(),
        }));

        console.log("Worksheet Data:", worksheetData);

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Licenses");

        const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        });

        console.log("Excel Buffer Size:", excelBuffer.byteLength);

        const blob = new Blob([excelBuffer], {
        type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `licenses-product-${id}.xlsx`;

        document.body.appendChild(a);

        requestAnimationFrame(() => {
        console.log("Triggering download...");
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);
        });

        showToast("success", `${licenses.length} license diunduh`);

        loadData();

    } catch (err) {
        console.error("TAKE STOCK ERROR:", err);
        showToast("error", err.message || "Gagal take stock");
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
          Licenses Produk {productName}
        </h1>

        <div className="flex gap-2">
          <button onClick={() => setShowSingleModal(true)} className="btn-add">
            + Tambah License
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBulkModal(true)}
            className="btn-purple"
          >
            Bulk Upload
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDuplicateModal(true)}
            className="btn-purple"
          >
            Check Duplicate
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProofModal(true)}
            className="btn-purple"
          >
            Stock Proofs
          </motion.button>

        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="rounded-lg bg-purple-900/30 p-3 text-center">
              <p className="text-xs text-gray-400 capitalize">{key}</p>
              <p className="text-lg text-white font-bold">{val}</p>
            </div>
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
          className="w-24 h-10 rounded-lg bg-purple-900/40 px-3 text-white"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          onClick={handleTakeStock}
          className="btn-purple-solid"
        >
          Take Stock
        </motion.button>
        <button onClick={() => {
            const blob = new Blob(["TEST"], { type: "text/plain" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "test.txt";

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            }}>
            Test Download
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-purple-600/40">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 text-center">License Key</th>
              <th className="py-3 text-center">Status</th>
              <th className="py-3 text-center">Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-10 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-gray-500"
                  >
                    Tidak ada license
                  </motion.div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {licenses.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: i * 0.03,
                      ease: "easeOut"
                    }}
                    whileHover={{
                      backgroundColor: "rgba(168,85,247,0.08)",
                    }}
                    className="border-b border-white/5"
                  >
                    <td className="py-4 text-white text-center font-medium">
                      {l.license_key}
                    </td>

                    <td className="py-4 text-center">
                      <StatusBadge status={l.status} />
                    </td>

                    <td className="py-4 text-center text-gray-400">
                      {l.note || "-"}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODALS ================= */}

      {/* SINGLE MODAL */}
      {showSingleModal && (
        <Modal onClose={() => setShowSingleModal(false)} title="Tambah License">
          <input
            placeholder="License Key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            className="input"
          />
          <input
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
          />
          <button onClick={handleSingleInsert} className="btn-success">
            Simpan
          </button>
        </Modal>
      )}

      {/* BULK MODAL */}
      {showBulkModal && (
        <Modal onClose={() => setShowBulkModal(false)} title="Bulk Upload">
          <textarea
            rows="6"
            placeholder="1 key per baris..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="input"
          />
          <button onClick={handleBulkUpload} className="btn-success">
            Upload
          </button>
        </Modal>
      )}

      {/* DUPLICATE MODAL */}
      {showDuplicateModal && (
        <Modal onClose={() => setShowDuplicateModal(false)} title="Check Duplicate">
          <textarea
            rows="6"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="input"
          />
          <button onClick={handleCheckDuplicate} className="btn-info">
            Check
          </button>
        </Modal>
      )}

      {showProofModal && (
        <Modal onClose={() => setShowProofModal(false)} title="Riwayat Stock Proof">
          {proofs.length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada proof</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {proofs.map((p) => (
                <div
                  key={p.proof_id}
                  className="border border-purple-600/30 rounded-lg p-3 text-sm"
                >
                  <p className="text-white font-semibold">
                    Proof #{p.proof_id}
                  </p>
                  <p className="text-gray-400">
                    Updated: {new Date(p.updated_at * 1000).toLocaleString()}
                  </p>

                  <p className="text-xs text-purple-400">
                    Size: {(p.size / 1024).toFixed(1)} KB
                  </p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => window.open(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/stock/proofs/${p.proof_id}`
                      )}
                      className="btn-success"
                    >
                      Excel
                    </button>

                    <button
                      onClick={() => window.open(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/stock/proofs/${p.proof_id}/csv`
                      )}
                      className="btn-info"
                    >
                      CSV
                    </button>

                    <button
                      onClick={() => window.open(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/stock/proofs/${p.proof_id}/json`
                      )}
                      className="btn-purple-solid"
                    >
                      JSON
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

    </motion.div>
  );
}

// ================= MODAL COMPONENT =================
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-purple-600 rounded-xl p-6 w-[400px]">
        <div className="flex justify-between mb-3">
          <h2 className="text-white font-bold">{title}</h2>
          <button onClick={onClose} className="text-red-400">✕</button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const color =
    status === "available"
      ? "bg-green-500/20 text-green-400"
      : status === "taken"
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-gray-500/20 text-gray-400";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {status}
    </motion.span>
  );
}
