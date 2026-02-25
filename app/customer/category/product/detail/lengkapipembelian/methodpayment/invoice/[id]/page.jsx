"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { authFetch } from "../../../../../../../../lib/authFetch";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle } from "lucide-react";

export default function InvoicePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isPdf = searchParams.get("print") === "pdf";

  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      const [paymentJson, deliveryJson] = await Promise.all([
        authFetch(`/api/v1/orders/${id}/payments`),
        authFetch(`/api/v1/orders/${id}/delivery`),
      ]);

      if (paymentJson.success) {
        setOrder(paymentJson.data.order);
      }

      if (deliveryJson.success) {
        setDelivery(deliveryJson.data);
      }
    } catch (err) {
      console.error("Invoice fetch error:", err);
    } finally {
      setLoading(false);
      if (isPdf) triggerPrint();
    }
  };

  const triggerPrint = () => {
    setTimeout(() => window.print(), 500);
  };

  const handleCopyKey = async () => {
    if (!delivery?.license_key) return;

    await navigator.clipboard.writeText(delivery.license_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ================= LOADING SKELETON =================
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex justify-center px-4 py-16">
        <div className="w-full max-w-2xl animate-pulse space-y-4">
          <div className="h-8 bg-purple-900/40 rounded w-1/2 mx-auto" />
          <div className="h-40 bg-purple-900/20 rounded-2xl" />
          <div className="h-24 bg-purple-900/20 rounded-xl" />
        </div>
      </main>
    );
  }

  // ================= ORDER NOT FOUND =================
  if (!order) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="mx-auto mb-3 text-red-400" size={48} />
          <p className="text-red-400 text-lg font-semibold">
            Invoice tidak ditemukan
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-4 py-10 ${
        isPdf ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <div className="max-w-2xl mx-auto">

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="border border-purple-500/30 rounded-3xl p-6 sm:p-10 shadow-lg"
        >

          {/* HEADER */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="text-4xl mb-2"
            >
              📦
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Pesanan Digital Kamu
            </h1>

            <p className="text-sm text-gray-400 mt-2">
              Terima kasih atas pembelianmu.
            </p>
          </div>

          {/* INVOICE */}
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1 border border-purple-500/40 rounded-full text-sm">
              Invoice :{" "}
              <strong>{order?.invoice_number ?? "-"}</strong>
            </div>
          </div>

          {/* DETAILS */}
          <div className="border border-purple-500/30 rounded-2xl p-4 sm:p-6 mb-6">
            <Row label="Produk">
              {delivery?.product_name ?? "Produk Digital"}
            </Row>

            <Row label="Qty">
              {delivery?.qty ?? "-"}
            </Row>

            <Row label="License Key">
              <div className="mt-2 border rounded-xl p-3 font-mono text-sm bg-gray-100 text-black break-all">
                {delivery?.license_key ?? "••••••••••"}
              </div>

              {delivery?.license_key && (
                <button
                  onClick={handleCopyKey}
                  className="mt-3 text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300"
                >
                  <Copy size={14} />
                  Copy License Key
                </button>
              )}

              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-green-400 text-xs mt-1"
                  >
                    ✅ License key disalin
                  </motion.div>
                )}
              </AnimatePresence>
            </Row>
          </div>

          {/* FOOTER */}
          <div className="text-center text-sm text-gray-400">
            <p className="mb-1 font-medium">
              Simpan invoice ini sebagai bukti pembelian
            </p>
            <p>
              Jika ada kendala, hubungi support kami.
            </p>
          </div>
        </motion.div>
      </div>

      {isPdf && <PrintStyle />}
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Row({ label, children }) {
  return (
    <div className="mb-4 text-left">
      <p className="text-xs sm:text-sm text-gray-400">{label}</p>
      <div className="text-sm sm:text-base">{children}</div>
    </div>
  );
}

function PrintStyle() {
  return (
    <style jsx global>{`
      @media print {
        body {
          background: white !important;
        }
        main {
          background: white !important;
          color: black !important;
        }
      }
    `}</style>
  );
}