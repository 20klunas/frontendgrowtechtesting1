"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { CheckCircle, Eye, Lock, FileText, Download, Copy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authFetch } from "../../../../../../../lib/authFetch";
import confetti from "canvas-confetti";

const VIEW_DURATION = 10; // detik one-time view

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const timerRef = useRef(null);

  const [delivery, setDelivery] = useState(null);

  // order detail (GET /orders/{id})
  const [order, setOrder] = useState(null);

  // payment status (GET /orders/{id}/payments)
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [revealedData, setRevealedData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [resending, setResending] = useState(false);
  const [closing, setClosing] = useState(false);

  const [countdown, setCountdown] = useState(VIEW_DURATION);
  const [blurred, setBlurred] = useState(false);

  const [toast, setToast] = useState(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  /* ================= CONFETTI ================= */
  const triggerConfetti = () => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  };

  useEffect(() => {
    if (!orderId) return;
    fetchAll();
    triggerConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  /* ================= FETCH ================= */
  const fetchAll = async () => {
    try {
      setLoading(true);

      const [deliveryJson, orderJson, paymentJson] = await Promise.all([
        authFetch(`/api/v1/orders/${orderId}/delivery`),
        authFetch(`/api/v1/orders/${orderId}`),
        authFetch(`/api/v1/orders/${orderId}/payments`), // ✅ tambahan
      ]);

      if (deliveryJson?.success) setDelivery(deliveryJson.data);

      // show order detail
      if (orderJson?.success) {
        // bisa dua bentuk: {order: {...}} atau langsung {...}
        setOrder(orderJson.data?.order ?? orderJson.data);
      }

      // payment status
      if (paymentJson?.success) {
        // biasanya paymentStatus return langsung data
        setPaymentInfo(paymentJson.data);
      }
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
      if (json?.success) setDelivery(json.data);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/payments`);
      if (json?.success) setPaymentInfo(json.data);
    } catch (err) {
      console.error("Payment status refresh error:", err);
    }
  };

  /* ================= TOAST ================= */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ================= COUNTDOWN ================= */
  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    let timeLeft = VIEW_DURATION;
    setCountdown(timeLeft);

    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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

  /* ================= REVEAL ================= */
  const handleReveal = async () => {
    if (!delivery?.can_reveal) return;

    try {
      setRevealing(true);

      const json = await authFetch(
        `/api/v1/orders/${orderId}/delivery/reveal`,
        { method: "POST" }
      );

      if (json?.success) {
        setRevealedData(json.data.data);
        setBlurred(false);
        startCountdown();
        fetchDelivery();
        showToast("Kode berhasil ditampilkan");
      } else {
        showToast(json?.error?.message || "Reveal gagal", "error");
      }
    } catch (err) {
      console.error("Reveal error:", err);
      showToast("Reveal gagal", "error");
    } finally {
      setRevealing(false);
    }
  };

  /* ================= COPY ================= */
  const copyLicense = async () => {
    try {
      await navigator.clipboard.writeText(revealedData?.license_key || "");
      showToast("License key disalin");
    } catch {
      showToast("Gagal menyalin", "error");
    }
  };

  /* ================= ACTIONS ================= */
  const handleResend = async () => {
    try {
      setResending(true);
      const json = await authFetch(`/api/v1/orders/${orderId}/delivery/resend`, {
        method: "POST",
      });

      if (!json?.success) {
        showToast(json?.error?.message || "Gagal resend email", "error");
        return;
      }

      fetchDelivery();
      showToast("Email dikirim ulang");
    } finally {
      setResending(false);
    }
  };

  const handleClose = async () => {
    try {
      setClosing(true);
      const json = await authFetch(`/api/v1/orders/${orderId}/delivery/close`, {
        method: "POST",
      });

      if (!json?.success) {
        showToast(json?.error?.message || "Gagal close delivery", "error");
        return;
      }

      fetchDelivery();
      showToast("Delivery ditutup");
    } finally {
      setClosing(false);
    }
  };

  /* ================= AMBIL PRODUCT_ID UNTUK RATING ================= */
  const rateProductId = useMemo(() => {
    // 1) kalau order punya product_id (legacy)
    if (order?.product_id) return order.product_id;

    // 2) kalau order items (cart flow)
    const firstItem = paymentInfo?.items?.[0];
    if (!firstItem) return null;

    // biasanya order_items punya product_id
    if (firstItem.product_id) return firstItem.product_id;

    // atau bisa nested product
    if (firstItem.product?.id) return firstItem.product.id;

    return null;
  }, [order, paymentInfo]);

  const invoiceNumber = useMemo(() => {
    return (
      paymentInfo?.invoice_number ||
      order?.invoice_number ||
      "-"
    );
  }, [paymentInfo, order]);

  /* ================= RATING (WAJIB BUY) ================= */
  const handleSubmitRating = async () => {
    if (!rateProductId || rating === 0) return;

    try {
      setSubmittingRating(true);

      const res = await authFetch(`/api/v1/favorites`, {
        method: "POST",
        body: JSON.stringify({
          product_id: rateProductId,
          rating: rating,
        }),
      });

      if (res?.success) {
        showToast("Terima kasih atas rating kamu ⭐");
        setRatingSubmitted(true);
      } else {
        showToast(res?.error?.message || "Gagal memberi rating", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan", "error");
    } finally {
      setSubmittingRating(false);
    }
  };

  const downloadInvoice = () => {
    window.open(`./invoice/${orderId}?print=pdf`, "_blank");
  };

  /* ================= LOADING ================= */
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
            <span className="text-white font-semibold">{invoiceNumber}</span>
          </p>

          <StatusBadge status={paymentInfo?.order_status || order?.status} />
        </div>

        {/* RATING SECTION */}
        {!ratingSubmitted && rateProductId && (
          <div className="mt-8 rounded-2xl border border-yellow-500/40 p-6 bg-yellow-500/5">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Beri Rating Produk
            </h2>

            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="text-3xl transition"
                >
                  <span
                    className={
                      star <= (hover || rating)
                        ? "text-yellow-400"
                        : "text-gray-600"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submittingRating}
                className="px-6 py-2 rounded-xl bg-yellow-500 text-black font-semibold disabled:opacity-50"
              >
                {submittingRating ? "Mengirim..." : "Kirim Rating"}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* DETAIL */}
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} />
              Detail Pengiriman
            </h2>

            <InfoRow label="Order ID" value={paymentInfo?.order_id || delivery?.order_id || "-"} />
            <InfoRow label="Invoice" value={invoiceNumber} />
            <InfoRow label="Qty" value={delivery?.total_qty || "-"} />
            <InfoRow label="Mode" value={delivery?.delivery_mode || "-"} />
            <InfoRow
              label="Total Delivery"
              value={delivery?.deliveries_count ?? "-"}
            />
            <InfoRow
              label="Status Email"
              value={
                delivery?.emailed ? (
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

            <button
              onClick={fetchPaymentStatus}
              className="mt-3 w-full rounded-xl border border-purple-500 py-2 text-sm font-semibold"
            >
              Refresh Payment Status
            </button>
          </div>

          {/* DIGITAL ACCESS */}
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4">Akses Produk Digital</h2>

            {!revealedData ? (
              <button
                onClick={handleReveal}
                disabled={!delivery?.can_reveal || revealing}
                className={`w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2
                  ${
                    delivery?.can_reveal
                      ? "bg-green-500 text-black"
                      : "bg-gray-800 text-gray-500"
                  }`}
              >
                <Eye size={18} />
                {revealing ? "Membuka..." : "One Time View"}
              </button>
            ) : (
              <div className="border border-green-500/40 rounded-xl p-4">
                <p className="text-sm text-gray-400">Produk</p>
                <p className="font-semibold mb-3">{revealedData?.product_name}</p>

                <p className="text-sm text-gray-400">License Key</p>

                <div
                  className={`rounded-lg p-3 font-mono text-green-400 bg-green-500/10 border border-green-500 relative
                    ${blurred ? "blur-sm select-none" : ""}`}
                >
                  {revealedData?.license_key}
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
  const s = typeof status === "string" ? status : status?.value;
  const isPaid = s === "paid" || s === "completed";

  return (
    <div
      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold
        ${
          isPaid
            ? "bg-green-500/10 text-green-400 border border-green-500/40"
            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/40"
        }`}
    >
      {isPaid ? "Paid / Completed" : s || "-"}
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