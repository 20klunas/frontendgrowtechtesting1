"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, Eye, Lock, FileText, Copy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch, invalidateAuthFetchCache } from "../../../../../../../lib/authFetch";
import { clearCheckoutBootstrapCache, readCheckoutBootstrapCache } from "../../../../../../../lib/clientBootstrap";
import { notifyCustomerCartChanged } from "../../../../../../../lib/customerCartEvents";
import confetti from "canvas-confetti";
import { invalidateFetcherCache } from "../../../../../../../lib/fetcher";
import { invalidatePublicFetchCache } from "../../../../../../../lib/publicFetch";

const DEFAULT_VIEW_DURATION = 30;
const MAX_BOOTSTRAP_RETRIES = 12;
const RETRY_INTERVAL_MS = 2500;

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const cached = readCheckoutBootstrapCache();

  const [delivery, setDelivery] = useState(cached?.delivery || null);
  const [order, setOrder] = useState(cached?.order || null);
  const [paymentInfo, setPaymentInfo] = useState(cached?.payment || null);
  const [loading, setLoading] = useState(true);
  const [revealedData, setRevealedData] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [resending, setResending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [countdown, setCountdown] = useState(DEFAULT_VIEW_DURATION);
  const [blurred, setBlurred] = useState(false);
  const [toast, setToast] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [editingRating, setEditingRating] = useState(false);
  const [bootstrapRetries, setBootstrapRetries] = useState(0);
  const [bootstrapError, setBootstrapError] = useState("");

  const timerRef = useRef(null);
  const initOnceRef = useRef(false);
  const retryTimerRef = useRef(null);
  const hasAutoRevealed = useRef(false);

  const revealWindowSeconds = Number(delivery?.reveal_window_seconds || DEFAULT_VIEW_DURATION);
  const isFulfillmentPending = Boolean(delivery?.fulfillment_pending) || (!delivery?.delivery_ready && Number(paymentInfo?.status === "paid"));

  const primaryProductName = useMemo(() => {
    return (
      revealedData?.product_name ||
      delivery?.primary_product_name ||
      paymentInfo?.items?.[0]?.product_name ||
      paymentInfo?.items?.[0]?.product?.name ||
      order?.item_details?.[0]?.product ||
      order?.product?.name ||
      "Produk digital"
    );
  }, [revealedData, delivery, paymentInfo, order]);

  const invoiceNumber = useMemo(() => {
    return paymentInfo?.invoice_number || order?.invoice_number || "-";
  }, [paymentInfo, order]);

  const rateProductId = useMemo(() => {
    if (order?.product_id) return order.product_id;
    const firstItem = paymentInfo?.items?.[0];
    if (!firstItem) return null;
    if (firstItem.product_id) return firstItem.product_id;
    if (firstItem.product?.id) return firstItem.product.id;
    return null;
  }, [order, paymentInfo]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => setToast(null), 2500);
  }, []);

  const invalidateAllClientCaches = useCallback(() => {
    clearCheckoutBootstrapCache();
    notifyCustomerCartChanged();
    invalidateAuthFetchCache([
      /\/api\/v1\/products\b/,
      /\/api\/v1\/catalog\//,
      /\/api\/v1\/categories\b/,
      /\/api\/v1\/subcategories\b/,
      /\/api\/v1\/bootstrap\/customer-home\b/,
      /\/api\/v1\/orders\b/,
    ]);
    invalidateFetcherCache([
      "/api/v1/products",
      "/api/v1/catalog",
      "/api/v1/categories",
      "/api/v1/subcategories",
      "/api/v1/bootstrap/customer-home",
      "/api/v1/orders",
    ]);
    invalidatePublicFetchCache([
      /\/api\/v1\/products\b/,
      /\/api\/v1\/catalog\/products\b/,
      /\/api\/v1\/content\//,
    ]);
  }, []);

  const triggerConfetti = useCallback(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, []);

  const fetchExistingRating = useCallback(async (productId) => {
    if (!productId) return;

    try {
      const json = await authFetch(`/api/v1/favorites?per_page=100&scope=all`);
      const rows = Array.isArray(json?.data?.data) ? json.data.data : [];
      const found = rows.find((item) => Number(item?.product_id) === Number(productId));
      const value = Number(found?.rating || 0);

      if (value > 0) {
        setExistingRating(value);
        setRating(value);
        setEditingRating(false);
      } else {
        setExistingRating(null);
      }
    } catch (err) {
      console.error("loadExistingRating error:", err);
    }
  }, []);

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!orderId) return false;

    try {
      if (!silent) setLoading(true);
      setBootstrapError("");

      const bootstrapJson = await authFetch(`/api/v1/bootstrap/orders/${orderId}/success`, {
        cache: "no-store",
      });

      if (!bootstrapJson?.success) {
        throw new Error(bootstrapJson?.error?.message || "Gagal memuat bootstrap order success");
      }

      const nextDelivery = bootstrapJson?.data?.delivery ?? null;
      const nextOrder = bootstrapJson?.data?.order?.order ?? bootstrapJson?.data?.order ?? null;
      const nextPayment = bootstrapJson?.data?.payment?.payment ?? bootstrapJson?.data?.payment ?? null;

      if (nextDelivery) setDelivery(nextDelivery);
      if (nextOrder) setOrder(nextOrder);
      if (nextPayment) setPaymentInfo(nextPayment);

      const nextProductId =
        nextOrder?.product_id ||
        nextPayment?.items?.[0]?.product_id ||
        nextPayment?.items?.[0]?.product?.id ||
        null;

      if (nextProductId) {
        await fetchExistingRating(nextProductId);
      }

      const ready = Boolean(nextDelivery);
      return ready;
    } catch (err) {
      console.error("Success bootstrap error:", err);
      setBootstrapError(err?.message || "Gagal memuat data pembelian");
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId, fetchExistingRating]);

  const fetchDelivery = useCallback(async () => {
    if (!orderId) return null;
    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/delivery`, { cache: "no-store" });
      if (json?.success) {
        setDelivery(json.data);
        return json.data;
      }
    } catch (err) {
      console.error("Refresh delivery error:", err);
    }
    return null;
  }, [orderId]);

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) return null;
    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/payments`, { cache: "no-store" });
      if (json?.success) {
        const nextPayment = json?.data?.payment ?? json?.data ?? null;
        setPaymentInfo(nextPayment);
        return nextPayment;
      }
    } catch (err) {
      console.error("Payment status refresh error:", err);
    }
    return null;
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    setRevealedData(null);
    setBootstrapRetries(0);
    setBootstrapError("");
    setBlurred(false);
    initOnceRef.current = false;
    hasAutoRevealed.current = false;
  }, [orderId]);

  useEffect(() => {
    if (!orderId || initOnceRef.current) return;

    initOnceRef.current = true;
    invalidateAllClientCaches();
    triggerConfetti();
    fetchAll({ silent: false }).then((ready) => {
      if (!ready) {
        fetchPaymentStatus();
        fetchDelivery();
      }
    });
  }, [orderId, fetchAll, fetchPaymentStatus, fetchDelivery, invalidateAllClientCaches, triggerConfetti]);

  useEffect(() => {
    if (!orderId) return;
    if (delivery) return;
    if (bootstrapRetries >= MAX_BOOTSTRAP_RETRIES) return;

    retryTimerRef.current = window.setTimeout(async () => {
      setBootstrapRetries((prev) => prev + 1);
      await fetchPaymentStatus();
      const ready = await fetchAll({ silent: true });
      if (!ready) {
        await fetchDelivery();
      }
    }, RETRY_INTERVAL_MS);

    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    };
  }, [orderId, delivery, bootstrapRetries, fetchAll, fetchDelivery, fetchPaymentStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    };
  }, []);

  const startCountdown = useCallback((initialSeconds = revealWindowSeconds) => {
    if (timerRef.current) window.clearInterval(timerRef.current);

    let timeLeft = Math.max(0, Number(initialSeconds || 0));
    setCountdown(timeLeft);

    if (timeLeft <= 0) {
      setBlurred(true);
      return;
    }

    timerRef.current = window.setInterval(() => {
      timeLeft -= 1;
      setCountdown(Math.max(0, timeLeft));

      if (timeLeft <= 0) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        setBlurred(true);
        setRevealedData(null);
        showToast("One-time view habis", "info");
      }
    }, 1000);
  }, [revealWindowSeconds, showToast]);

  useEffect(() => {
    if (
      delivery?.is_revealed &&
      delivery?.reveal_active &&
      !revealedData &&
      !hasAutoRevealed.current
    ) {
      hasAutoRevealed.current = true;
      handleReveal();
    }
  }, [delivery, revealedData]);

  useEffect(() => {
    if (!delivery?.reveal_active) return;
    setBlurred(false);
    startCountdown(Number(delivery?.reveal_remaining_seconds || revealWindowSeconds));
  }, [delivery?.reveal_active, delivery?.reveal_remaining_seconds, revealWindowSeconds, startCountdown]);

  const handleReveal = async () => {
    if (!orderId) return;

    const latestDelivery = delivery || (await fetchDelivery());

    if (!latestDelivery?.can_reveal && !latestDelivery?.reveal_active && !latestDelivery?.is_revealed) {
      showToast("Produk masih disiapkan, coba lagi sebentar", "info");
      return;
    }

    try {
      setRevealing(true);

      const json = await authFetch(`/api/v1/orders/${orderId}/delivery/reveal`, { method: "POST" });

      if (json?.success) {
        setRevealedData(json.data);
        setBlurred(false);
        startCountdown(Number(json?.data?.reveal_remaining_seconds || latestDelivery?.reveal_remaining_seconds || revealWindowSeconds));
        await fetchDelivery();
        showToast("Kode berhasil ditampilkan");
      } else {
        showToast(json?.error?.message || "Reveal gagal", "error");
      }
    } catch (err) {
      console.error("Reveal error:", err);
      showToast(err?.message || "Reveal gagal", "error");
    } finally {
      setRevealing(false);
    }
  };

  const copyLicense = async () => {
    try {
      await navigator.clipboard.writeText(revealedData?.license_key || "");
      showToast("License key disalin");
    } catch {
      showToast("Gagal menyalin", "error");
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const json = await authFetch(`/api/v1/orders/${orderId}/delivery/resend`, {
        method: "POST",
      });

      if (!json?.success) {
        showToast(json?.error?.message || "Gagal kirim email", "error");
        return;
      }

      await fetchDelivery();
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

      await fetchDelivery();
      showToast("Delivery ditutup");
    } finally {
      setClosing(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!rateProductId || rating === 0) return;

    try {
      setSubmittingRating(true);
      const res = await authFetch(`/api/v1/favorites`, {
        method: "POST",
        body: JSON.stringify({ product_id: rateProductId, rating }),
      });

      if (res?.success) {
        showToast(existingRating ? "Rating berhasil diperbarui ⭐" : "Terima kasih atas rating kamu ⭐");
        setExistingRating(rating);
        setEditingRating(false);
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

  if (!delivery) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-purple-500/40 p-8 bg-gradient-to-b from-purple-900/20 to-black text-center">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={56} />
          <h1 className="text-3xl font-bold mb-3">Pembayaran diterima</h1>
          <p className="text-gray-300 mb-3">Produk digital sedang disiapkan. Halaman ini akan mencoba memuat ulang otomatis.</p>
          <p className="text-sm text-gray-500 mb-6">Order #{orderId} · percobaan {Math.min(bootstrapRetries + 1, MAX_BOOTSTRAP_RETRIES)}/{MAX_BOOTSTRAP_RETRIES}</p>

          {bootstrapError ? (
            <p className="text-sm text-red-400 mb-4">{bootstrapError}</p>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={async () => {
                invalidateAllClientCaches();
                setBootstrapRetries(0);
                const ready = await fetchAll({ silent: false });
                if (!ready) {
                  await fetchPaymentStatus();
                  await fetchDelivery();
                }
              }}
              className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Coba Muat Ulang
            </button>

            <Link
              href="/customer/profile"
              className="rounded-xl border border-purple-500 px-5 py-3 text-sm font-semibold"
            >
              Ke Riwayat Pembelian
            </Link>
          </div>
        </div>

        {toast && <Toast {...toast} />}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-purple-500/40 p-10 text-center mb-10 bg-gradient-to-b from-purple-900/20 to-black">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
          <h1 className="text-4xl font-bold mb-3">Pembelianmu Berhasil Dibayar</h1>
          <p className="text-gray-300 text-lg mb-3">
            Invoice : <span className="text-white font-semibold">{invoiceNumber}</span>
          </p>
          <StatusBadge status={paymentInfo?.order_status || paymentInfo?.status} />
        </div>

        {rateProductId && (
          <div className="mt-8 rounded-2xl border border-yellow-500/40 p-6 bg-yellow-500/5 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              {existingRating && !editingRating ? "Rating Produk Kamu" : "Beri Rating Produk"}
            </h2>

            {existingRating && !editingRating ? (
              <div className="text-center">
                <div className="mb-3 text-3xl text-yellow-400">
                  {"★".repeat(existingRating)}
                  <span className="text-gray-600">{"★".repeat(5 - existingRating)}</span>
                </div>
                <p className="mb-4 text-sm text-gray-300">
                  Kamu sudah pernah memberi rating untuk produk ini. Saat repeat order, kamu boleh mengubah rating yang sudah ada.
                </p>
                <button
                  onClick={() => {
                    setEditingRating(true);
                    setRating(existingRating);
                  }}
                  className="px-6 py-2 rounded-xl bg-yellow-500 text-black font-semibold"
                >
                  Ubah Rating
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="text-3xl transition"
                    >
                      <span className={star <= (hover || rating) ? "text-yellow-400" : "text-gray-600"}>★</span>
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <button
                    onClick={handleSubmitRating}
                    disabled={rating === 0 || submittingRating}
                    className="px-6 py-2 rounded-xl bg-yellow-500 text-black font-semibold disabled:opacity-50"
                  >
                    {submittingRating ? "Mengirim..." : existingRating ? "Simpan Perubahan Rating" : "Kirim Rating"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} />
              Detail Pengiriman
            </h2>

            <InfoRow label="Order ID" value={paymentInfo?.order_id || delivery?.order_id || "-"} />
            <InfoRow label="Invoice" value={invoiceNumber} />
            <InfoRow label="Produk" value={primaryProductName || "-"} />
            <InfoRow label="Qty" value={delivery?.total_qty || "-"} />
            <InfoRow label="Mode" value={delivery?.delivery_mode || "-"} />
            <InfoRow label="Total Delivery" value={delivery?.deliveries_count ?? "-"} />
            <InfoRow
              label="Status Email"
              value={
                delivery?.emailed ? <span className="text-green-400">Terkirim</span> : <span className="text-yellow-400">Belum</span>
              }
            />
          </div>

          <div className="rounded-2xl border border-purple-500/40 p-6">
            <h2 className="text-lg font-semibold mb-4">Akses Produk Digital</h2>

            {delivery?.fulfillment_pending || delivery?.deliveries_count === 0 ? (
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4 text-sm text-yellow-300">
                Produk digital masih disiapkan oleh sistem. Halaman ini akan mencoba sinkron otomatis. Bila belum muncul, tekan tombol muat ulang.
                <button
                  onClick={async () => {
                    invalidateAllClientCaches();
                    await fetchAll({ silent: false });
                    await fetchDelivery();
                  }}
                  className="mt-4 w-full rounded-xl border border-yellow-500 py-2 font-semibold text-yellow-300"
                >
                  Muat Ulang Produk Digital
                </button>
              </div>
            ) : delivery?.delivery_mode?.toLowerCase() === "one_time" && !delivery?.is_revealed ? (
              <button
                onClick={handleReveal}
                disabled={revealing || !delivery?.can_reveal}
                className={`w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 ${
                  delivery?.can_reveal ? "bg-green-500 text-black" : "bg-gray-800 text-gray-500"
                }`}
              >
                <Eye size={18} />
                {revealing ? "Membuka..." : delivery?.can_reveal ? "One Time View" : "Menyiapkan One Time View..."}
              </button>
            ) : revealedData ? (
              <div className="border border-green-500/40 rounded-xl p-4">
                <p className="text-sm text-gray-400">Produk</p>
                <p className="font-semibold mb-3">{primaryProductName}</p>
                <p className="text-sm text-gray-400">License Key</p>
                <div className={`rounded-lg p-3 font-mono text-green-400 bg-green-500/10 border border-green-500 ${blurred ? "blur-sm select-none" : ""}`}>
                  {revealedData?.license_key}
                </div>

                {!blurred && (
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Auto blur dalam {countdown}s</span>
                    <button onClick={copyLicense} className="flex items-center gap-1 hover:text-white">
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                )}

                {blurred && <p className="text-xs text-red-400 mt-2">One-time view selesai</p>}
              </div>
            ) : (
              <div className="text-yellow-400 text-sm text-center py-4">
                <span className="font-semibold">"One Time View"</span> selesai.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={handleResend} disabled={resending} className="rounded-xl border border-purple-500 py-2 text-sm">
                {resending ? "Mengirim..." : "Send Email"}
              </button>

              <Link
                href={`./invoice/${orderId}`}
                className="w-full rounded-xl border border-purple-500 py-2 text-sm text-center font-medium hover:bg-purple-500/10 transition"
              >
                Lihat Detail Produk
              </Link>
            </div>

            {delivery?.delivery_mode === "one_time" && delivery?.deliveries_count > 0 && (
              <button
                onClick={handleClose}
                disabled={closing || !delivery?.is_revealed}
                className="w-full mt-3 rounded-xl border border-red-500 text-red-400 py-2 text-sm font-medium hover:bg-red-500/10 transition disabled:opacity-50"
              >
                {closing ? "Menutup..." : "Close Delivery"}
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
              <Lock size={14} />
              Data terenkripsi & aman
            </div>
          </div>
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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm mb-2 gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = typeof status === "string" ? status : status?.value;
  const safeStatus = String(s || "").toLowerCase();
  const isPaid = ["paid", "completed", "success", "settlement", "capture", "fulfilled"].includes(safeStatus);

  return (
    <div
      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
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
      className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm shadow-lg ${
        type === "error" ? "bg-red-500 text-white" : type === "info" ? "bg-blue-500 text-white" : "bg-green-500 text-black"
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
