"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "../../../../../../lib/authFetch";
import { Lock, CheckCircle } from "lucide-react";

function ProcessContent() {
  const router = useRouter();
  const params = useSearchParams();

  const orderId = params.get("order");

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayment();
  }, []);

  const fetchPayment = async () => {
    try {
      const json = await authFetch(`/api/v1/orders/${orderId}/payments`);

      if (json.success) {
        setPayment(json.data.payment);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white p-10">Memuat pembayaran...</div>;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-xl text-center">

        <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />

        <h1 className="text-2xl font-bold mb-2">
          Menunggu Verifikasi Pembayaran
        </h1>

        <p className="text-gray-400 mb-6">
          Order #{orderId}
        </p>

        <div className="border border-purple-500/40 rounded-xl p-4 mb-6">
          <Row label="Metode" value={payment?.method} />
          <Row label="Status" value={payment?.status} />
          <Row label="Amount" value={`Rp ${Number(payment?.amount).toLocaleString()}`} />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
          <Lock size={16} />
          Pembayaran aman & terenkripsi
        </div>

        <button
          onClick={() => router.push(`../success?order=${orderId}`)}
          className="w-full rounded-xl bg-green-500 py-3 font-semibold text-black"
        >
          Refresh / Lanjut
        </button>
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
      <span className="text-white">{value}</span>
    </div>
  );
}