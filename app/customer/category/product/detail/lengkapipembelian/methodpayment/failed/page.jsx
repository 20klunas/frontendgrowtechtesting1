"use client";

import { Suspense } from "react";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FailedContent() {
  const params = useSearchParams();
  const orderId = params.get("order");

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-white px-4">
      <div className="max-w-lg w-full text-center border border-red-500/40 rounded-3xl p-10 bg-gradient-to-b from-red-900/20 to-black">
        <XCircle className="mx-auto mb-6 text-red-500" size={64} />

        <h1 className="text-3xl font-bold mb-4">
          Pembayaran Gagal
        </h1>

        <p className="text-gray-400 mb-6">
          Order ID: <span className="text-white">{orderId}</span>
        </p>

        <div className="grid gap-4">
          <Link
            href={`/customer/category/product/detail/lengkapipembelian/methodpayment`}
            className="rounded-xl bg-purple-700 py-3 font-semibold"
          >
            Coba Lagi
          </Link>

          <Link
            href="/orders"
            className="rounded-xl border border-purple-500 py-3 font-semibold"
          >
            Lihat Pesanan
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}