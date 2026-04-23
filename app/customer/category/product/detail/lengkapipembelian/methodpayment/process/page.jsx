"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch, invalidateAuthFetchCache } from "../../../../../../../lib/authFetch";
import { clearCheckoutBootstrapCache } from "../../../../../../../lib/clientBootstrap";
import { notifyCustomerCartChanged } from "../../../../../../../lib/customerCartEvents";
import { Lock, CheckCircle, XCircle } from "lucide-react";
import { invalidateFetcherCache } from "../../../../../../../lib/fetcher";
import { invalidatePublicFetchCache } from "../../../../../../../lib/publicFetch";

function ProcessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order");

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  const pollingRef = useRef(null);
  const redirectedRef = useRef(false);

  const SUCCESS_STATUS = ["paid", "completed", "success", "settlement", "capture"];
  const FAILED_STATUS = ["failed", "error", "cancelled", "cancel", "expire", "deny"];

  const invalidateClientCaches = () => {
    clearCheckoutBootstrapCache();
    notifyCustomerCartChanged();
    invalidateAuthFetchCache([
      /\/api\/v1\/products\b/,
      /\/api\/v1\/catalog\//,
      /\/api\/v1\/categories\b/,
      /\/api\/v1\/subcategories\b/,
      /\/api\/v1\/orders\b/,
      /\/api\/v1\/bootstrap\/orders\//,
    ]);
    invalidateFetcherCache([
      "/api/v1/products",
      "/api/v1/catalog",
      "/api/v1/categories",
      "/api/v1/subcategories",
      "/api/v1/orders",
    ]);
    invalidatePublicFetchCache([/\/api\/v1\/products\b/, /\/api\/v1\/catalog\/products\b/]);
  };

  const fetchPayment = async () => {
    if (!orderId) return;

    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/payments`, { cache: "no-store" });
      if (!json?.success) return;

      const paymentData = json?.data?.payment || json?.data;
      const status = String(paymentData?.status || "").toLowerCase();

      setPayment(paymentData);

      if (SUCCESS_STATUS.includes(status) && !redirectedRef.current) {
        redirectedRef.current = true;
        invalidateClientCaches();
        router.replace(`/customer/category/product/detail/lengkapipembelian/methodpayment/success?order=${orderId}`);
        return;
      }

      if (FAILED_STATUS.includes(status) && !redirectedRef.current) {
        redirectedRef.current = true;
        router.replace(`/customer/category/product/detail/lengkapipembelian/methodpayment/failed?order=${orderId}`);
        return;
      }
    } catch (err) {
      console.error("Fetch payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = async () => {
    await fetchPayment();
    pollingRef.current = window.setTimeout(startPolling, 3000);
  };

  useEffect(() => {
    if (!orderId) return;

    startPolling();

    return () => {
      if (pollingRef.current) window.clearTimeout(pollingRef.current);
    };
  }, [orderId]);

  if (loading && !payment) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Memuat pembayaran...
      </main>
    );
  }

  const status = String(payment?.status || "").toLowerCase();

  const statusConfig = {
    pending: {
      icon: <CheckCircle className="text-yellow-400" size={48} />,
      title: "Menunggu Pembayaran",
      color: "text-yellow-400",
      button: null,
    },
    paid: {
      icon: <CheckCircle className="text-green-400" size={48} />,
      title: "Pembayaran Berhasil",
      color: "text-green-400",
      button: (
        <button
          onClick={() => router.push(`/customer/category/product/detail/lengkapipembelian/methodpayment/success?order=${orderId}`)}
          className="w-full rounded-xl bg-green-500 py-3 font-semibold text-black"
        >
          Lanjut Ke Pengiriman
        </button>
      ),
    },
    failed: {
      icon: <XCircle className="text-red-400" size={48} />,
      title: "Pembayaran Gagal",
      color: "text-red-400",
      button: (
        <button onClick={() => router.back()} className="w-full rounded-xl bg-red-500 py-3 font-semibold text-black">
          Coba Lagi
        </button>
      ),
    },
  };

  const current = statusConfig[status] || statusConfig.pending;

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-xl text-center">
        {current.icon}
        <h1 className={`text-2xl font-bold mb-2 ${current.color}`}>{current.title}</h1>
        <p className="text-gray-400 mb-6">Order #{orderId}</p>

        <div className="border border-purple-500/40 rounded-xl p-4 mb-6">
          <Row label="Metode" value={payment?.gateway_code} />
          <Row label="Status" value={payment?.status} />
          <Row label="Amount" value={`Rp ${Number(payment?.amount || 0).toLocaleString("id-ID")}`} />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
          <Lock size={16} />
          Pembayaran aman & terenkripsi
        </div>

        {current.button}
      </div>
    </main>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <ProcessContent />
    </Suspense>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-gray-300">
      <span>{label}</span>
      <span className="text-white capitalize">{value}</span>
    </div>
  );
}
