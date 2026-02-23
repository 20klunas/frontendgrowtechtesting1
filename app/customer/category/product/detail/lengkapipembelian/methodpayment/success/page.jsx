"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("order");

  return (
    <main className="min-h-screen bg-black px-4 py-20 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="rounded-3xl border border-purple-500/40 p-10 text-center mb-10">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
          <h1 className="text-4xl font-bold mb-2">
            Pembayaran Berhasil
          </h1>
          <p className="text-gray-300">
            Order #{orderId} berhasil dibayar
          </p>
        </div>

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
    </main>
  );
}