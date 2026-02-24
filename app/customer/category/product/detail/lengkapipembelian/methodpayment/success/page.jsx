"use client";

import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Eye, Mail, RefreshCw, Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authFetch } from "../../../../../../../lib/authFetch";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");

  const [delivery, setDelivery] = useState(null);
  const [revealedData, setRevealedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [resending, setResending] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchDelivery();
  }, []);

  const fetchDelivery = async () => {
    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/delivery`);

      if (json.success) {
        setDelivery(json.data);
      }
    } catch (err) {
      console.error("Delivery fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (!delivery?.can_reveal) return;

    try {
      setRevealing(true);

      const json = await authFetch(
        `/api/v1/orders/${orderId}/delivery/reveal`,
        {
          method: "POST",
        }
      );

      if (json.success) {
        setRevealedData(json.data.data);
        fetchDelivery(); // refresh state
      }
    } catch (err) {
      console.error("Reveal error:", err);
    } finally {
      setRevealing(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);

      await authFetch(`/api/v1/orders/${orderId}/delivery/resend`, {
        method: "POST",
      });

      fetchDelivery();
    } finally {
      setResending(false);
    }
  };

  const handleClose = async () => {
    try {
      setClosing(true);

      await authFetch(`/api/v1/orders/${orderId}/delivery/close`, {
        method: "POST",
      });

      fetchDelivery();
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return <div className="text-white p-10">Memuat delivery...</div>;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER SUCCESS */}
        <div className="rounded-3xl border border-purple-500/40 p-10 text-center mb-10 bg-gradient-to-b from-purple-900/20 to-black">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
          <h1 className="text-4xl font-bold mb-2">
            Pembayaran Berhasil
          </h1>
          <p className="text-gray-300">
            Order #{orderId} berhasil dibayar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* DETAIL ORDER */}
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Detail Pengiriman
            </h2>

            <InfoRow label="Order ID" value={delivery.order_id} />
            <InfoRow label="Qty" value={delivery.qty} />
            <InfoRow label="Mode" value={delivery.delivery_mode} />
            <InfoRow label="Total Delivery" value={delivery.deliveries_count} />
            <InfoRow
              label="Status Email"
              value={
                delivery.emailed ? (
                  <span className="text-green-400">Terkirim</span>
                ) : (
                  <span className="text-yellow-400">Belum</span>
                )
              }
            />
          </div>

          {/* AKSES PRODUK DIGITAL */}
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Akses Produk Digital
            </h2>

            {!revealedData ? (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  Klik tombol di bawah untuk menampilkan kode.  
                  ⚠️ Hanya bisa dilihat satu kali.
                </p>

                <button
                  onClick={handleReveal}
                  disabled={!delivery.can_reveal || revealing}
                  className={`w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition
                    ${
                      delivery.can_reveal
                        ? "bg-green-500 text-black hover:bg-green-400"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  <Eye size={18} />
                  {revealing ? "Membuka..." : "One Time View"}
                </button>

                {!delivery.can_reveal && (
                  <p className="text-xs text-red-400 mt-2">
                    Kode sudah pernah direveal / tidak tersedia
                  </p>
                )}
              </>
            ) : (
              <div className="bg-black border border-green-500/40 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">
                  Produk
                </p>
                <p className="font-semibold mb-3">
                  {revealedData.product_name}
                </p>

                <p className="text-sm text-gray-400 mb-1">
                  License Key
                </p>
                <div className="bg-green-500/10 border border-green-500 rounded-lg p-3 font-mono text-green-400">
                  {revealedData.license_key}
                </div>

                <p className="text-xs text-yellow-400 mt-3">
                  ⚠️ Simpan kode ini. Tidak dapat ditampilkan kembali.
                </p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleResend}
                disabled={resending}
                className="rounded-xl border border-purple-500 py-2 text-sm flex items-center justify-center gap-2 hover:bg-purple-500/10"
              >
                <Mail size={16} />
                {resending ? "Mengirim..." : "Resend Email"}
              </button>

              <button
                onClick={fetchDelivery}
                className="rounded-xl border border-purple-500 py-2 text-sm flex items-center justify-center gap-2 hover:bg-purple-500/10"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <button
              onClick={handleClose}
              disabled={closing}
              className="w-full mt-3 rounded-xl bg-red-500/10 border border-red-500 py-2 text-sm hover:bg-red-500/20"
            >
              {closing ? "Menutup..." : "Close Delivery"}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
              <Lock size={14} />
              Data terenkripsi & aman
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/orders"
            className="rounded-xl bg-purple-700 py-4 text-center font-semibold hover:bg-purple-600"
          >
            Lihat Semua Pemesanan
          </Link>

          <Link
            href={`./invoice/${orderId}`}
            className="rounded-xl border border-purple-500 py-4 text-center font-semibold hover:bg-purple-500/10"
          >
            Lihat Detail Produk
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}