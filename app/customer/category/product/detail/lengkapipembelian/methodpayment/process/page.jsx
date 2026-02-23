"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock } from "lucide-react";

function ProcessContent() {
  const router = useRouter();
  const params = useSearchParams();

  const orderId = params.get("order");
  const method = params.get("method");

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-xl text-center">

        <h1 className="text-3xl font-bold mb-2">
          Selesaikan Pembayaran
        </h1>

        <p className="text-gray-400 mb-8">
          Scan QR Code di bawah
        </p>

        <div className="rounded-3xl border border-purple-500/40 p-6 mb-6">
          <Image
            src="/qrcodedummy.png"
            alt="QRIS"
            width={240}
            height={240}
            className="mx-auto mb-6 rounded-xl bg-white p-4"
          />

          <p className="text-sm text-gray-400">Order</p>
          <p className="text-lg font-bold">{orderId}</p>

          <p className="text-sm text-gray-400 mt-4">Metode</p>
          <p className="text-lg font-bold uppercase">{method}</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-300 mb-8">
          <Lock size={16} />
          Pembayaran aman
        </div>

        <button
          onClick={() => router.push(`../success?order=${orderId}`)}
          className="w-full rounded-xl bg-green-500 py-4 font-semibold text-black"
        >
          Saya Sudah Bayar
        </button>
      </div>
    </main>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading payment...</div>}>
      <ProcessContent />
    </Suspense>
  );
}