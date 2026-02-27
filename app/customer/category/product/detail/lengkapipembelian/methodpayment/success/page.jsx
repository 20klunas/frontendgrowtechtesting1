"use client";

import { Suspense, useEffect, useState } from "react";
import {
  CheckCircle,
  Eye,
  Mail,
  RefreshCw,
  Lock,
  FileText,
  Download,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authFetch } from "../../../../../../../lib/authFetch";
import confetti from "canvas-confetti";
import { useRef } from "react";

const timerRef = useRef(null);

const VIEW_DURATION = 10; // detik one-time view

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");

  const [delivery, setDelivery] = useState(null);
  const [order, setOrder] = useState(null);
  const [revealedData, setRevealedData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [resending, setResending] = useState(false);
  const [closing, setClosing] = useState(false);

  const [countdown, setCountdown] = useState(VIEW_DURATION);
  const [blurred, setBlurred] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAll();
    triggerConfetti();
  }, []);

  /* ================= CONFETTI ================= */
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  /* ================= FETCH ================= */
  const fetchAll = async () => {
    try {
      setLoading(true);

      const [deliveryJson, orderJson] = await Promise.all([
        authFetch(`/api/v1/orders/${orderId}/delivery`),
        authFetch(`/api/v1/orders/${orderId}`),
      ]);

      if (deliveryJson.success) setDelivery(deliveryJson.data);
      if (orderJson.success) setOrder(orderJson.data.order);
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDelivery = async () => {
    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/delivery`);
      if (json.success) setDelivery(json.data);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  /* ================= TOAST ================= */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ================= REVEAL ================= */
  const handleReveal = async () => {
    if (!delivery?.can_reveal) return;

    try {
      setRevealing(true);

      const json = await authFetch(
        `/api/v1/orders/${orderId}/delivery/reveal`,
        { method: "POST" }
      );

      if (json.success) {
        setRevealedData(json.data.data);
        setCountdown(VIEW_DURATION);
        setBlurred(false);
        startCountdown();
        fetchDelivery();
        showToast("Kode berhasil ditampilkan");
      }
    } catch (err) {
      console.error("Reveal error:", err);
      showToast("Reveal gagal", "error");
    } finally {
      setRevealing(false);
    }
  };

  /* ================= COUNTDOWN ================= */
  const startCountdown = () => {
    let timeLeft = VIEW_DURATION;

    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        setBlurred(true);
        showToast("One-time view habis", "info");
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ================= COPY ================= */
  const copyLicense = async () => {
    try {
      await navigator.clipboard.writeText(revealedData.license_key);
      showToast("License key disalin");
    } catch {
      showToast("Gagal menyalin", "error");
    }
  };

  /* ================= ACTIONS ================= */
  const handleResend = async () => {
    try {
      setResending(true);
      await authFetch(`/api/v1/orders/${orderId}/delivery/resend`, {
        method: "POST",
      });
      fetchDelivery();
      showToast("Email dikirim ulang");
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
      showToast("Delivery ditutup");
    } finally {
      setClosing(false);
    }
  };

  const downloadInvoice = () => {
    window.open(`./invoice/${orderId}?print=pdf`, "_blank");
  };

  /* ================= LOADING SKELETON ================= */
  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-6">
          <SkeletonCard />
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="rounded-3xl border border-purple-500/40 p-10 text-center mb-10 bg-gradient-to-b from-purple-900/20 to-black">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />

          <h1 className="text-4xl font-bold mb-3">
            Pembelianmu Berhasil Dibayar
          </h1>

          <p className="text-gray-300 text-lg mb-3">
            Invoice :{" "}
            <span className="text-white font-semibold">
              {order?.invoice_number}
            </span>
          </p>

          <StatusBadge status={order?.status} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* DETAIL */}
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} />
              Detail Pengiriman
            </h2>

            <InfoRow label="Order ID" value={delivery.order_id} />
            <InfoRow label="Invoice" value={order?.invoice_number} />
            <InfoRow label="Qty" value={delivery.total_qty} />
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

            <button
              onClick={downloadInvoice}
              className="mt-4 w-full rounded-xl bg-purple-700 py-2 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-purple-600"
            >
              <Download size={16} />
              Download Invoice PDF
            </button>
          </div>

          {/* DIGITAL ACCESS */}
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Akses Produk Digital
            </h2>

            {!revealedData ? (
              <>
                <button
                  onClick={handleReveal}
                  disabled={!delivery.can_reveal || revealing}
                  className={`w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2
                    ${
                      delivery.can_reveal
                        ? "bg-green-500 text-black"
                        : "bg-gray-800 text-gray-500"
                    }`}
                >
                  <Eye size={18} />
                  {revealing ? "Membuka..." : "One Time View"}
                </button>
              </>
            ) : (
              <div className="border border-green-500/40 rounded-xl p-4">
                <p className="text-sm text-gray-400">Produk</p>
                <p className="font-semibold mb-3">
                  {revealedData.product_name}
                </p>

                <p className="text-sm text-gray-400">License Key</p>

                <div
                  className={`rounded-lg p-3 font-mono text-green-400 bg-green-500/10 border border-green-500 relative
                    ${blurred ? "blur-sm select-none" : ""}`}
                >
                  {revealedData.license_key}
                </div>

                {!blurred && (
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Auto blur dalam {countdown}s</span>
                    <button
                      onClick={copyLicense}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                )}

                {blurred && (
                  <p className="text-xs text-red-400 mt-2">
                    One-time view selesai
                  </p>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleResend}
                disabled={resending}
                className="rounded-xl border border-purple-500 py-2 text-sm"
              >
                {resending ? "Mengirim..." : "Resend Email"}
              </button>

              <button
                onClick={fetchDelivery}
                className="rounded-xl border border-purple-500 py-2 text-sm"
              >
                Refresh
              </button>
            </div>

            <button
              onClick={handleClose}
              disabled={closing}
              className="w-full mt-3 rounded-xl bg-red-500/10 border border-red-500 py-2 text-sm"
            >
              {closing ? "Menutup..." : "Close Delivery"}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
              <Lock size={14} />
              Data terenkripsi & aman
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/orders"
            className="rounded-xl bg-purple-700 py-4 text-center font-semibold"
          >
            Lihat Semua Pemesanan
          </Link>

          <Link
            href={`./invoice/${orderId}`}
            className="rounded-xl border border-purple-500 py-4 text-center font-semibold"
          >
            Lihat Detail Produk
          </Link>
        </div>
      </div>

      {/* TOAST */}
      {toast && <Toast {...toast} />}
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

/* ================= COMPONENTS ================= */

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPaid = status === "paid" || status === "completed";

  return (
    <div
      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold
        ${
          isPaid
            ? "bg-green-500/10 text-green-400 border border-green-500/40"
            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/40"
        }`}
    >
      {isPaid ? "Paid / Completed" : status}
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm shadow-lg
        ${
          type === "error"
            ? "bg-red-500 text-white"
            : type === "info"
            ? "bg-blue-500 text-white"
            : "bg-green-500 text-black"
        }`}
    >
      {message}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-purple-500/20 p-6 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
      <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-800 rounded w-2/3"></div>
    </div>
  );
}