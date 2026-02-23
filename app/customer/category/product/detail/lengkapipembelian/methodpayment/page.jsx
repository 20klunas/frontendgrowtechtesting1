"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authFetch } from "../../../../../../lib/authFetch";
import {
  CreditCard,
  Wallet,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <PaymentPage />
    </Suspense>
  );
}

function PaymentPage() {
  const router = useRouter();

  const [checkout, setCheckout] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const subtotal = checkout?.summary?.subtotal ?? 0;
  const total = checkout?.summary?.total ?? 0;
  const discount = checkout?.summary?.discount_total ?? 0;
  const item = checkout?.items?.[0];

  useEffect(() => {
    fetchCheckout();
    fetchWallet();
  }, []);

  const fetchCheckout = async () => {
    try {
      const json = await authFetch("/api/v1/cart/checkout");
      if (json.success) setCheckout(json.data);
    } finally {
      setLoading(false);
    }
  };

  /* ✅ FIX WALLET BALANCE */
  const fetchWallet = async () => {
    try {
      const json = await authFetch("/api/v1/wallet/summary");

      if (json.success) {
        setWalletBalance(json.data.wallet?.balance ?? 0);
      }
    } catch {
      setWalletBalance(0);
    }
  };

  const handleCreatePayment = async () => {
    if (!checkout || processing) return;

    setProcessing(true);

    try {
      const orderId = checkout.order.id;

      const json = await authFetch(`/api/v1/orders/${orderId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          method: selectedMethod,
        }),
      });

      if (json.success) {
        /* ✅ LANGSUNG KE DELIVERY / INVOICE */
        router.push(`./invoice/${orderId}`);
      } else {
        alert(json.message || "Gagal membuat pembayaran");
      }
    } catch {
      alert("Pembayaran gagal");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Memuat checkout...
      </main>
    );
  }

  if (!checkout || !checkout.items?.length) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Checkout kosong
      </main>
    );
  }

  const insufficientWallet = walletBalance < total;

  return (
    <main className="bg-black min-h-screen px-4 pb-24 text-white">
      <div className="max-w-5xl mx-auto">

        {/* HEADER STEP */}
        <StepHeader />

        <h1 className="text-4xl font-bold mb-8">
          Pilih Metode Pembayaran
        </h1>

        {/* PAYMENT OPTIONS */}
        <div className="space-y-3 mb-6">

          <PaymentOption
            active={selectedMethod === "qris"}
            onClick={() => setSelectedMethod("qris")}
            icon={<CreditCard />}
            title="QRIS"
            desc="Bayar QRIS dari semua Bank"
          />

          <PaymentOption
            active={selectedMethod === "wallet"}
            onClick={() => setSelectedMethod("wallet")}
            icon={<Wallet />}
            title="Wallet"
            desc={`Saldo Tersedia: Rp ${walletBalance.toLocaleString("id-ID")}`}
            warning={insufficientWallet}
          />
        </div>

        {/* INFO */}
        <div className="border border-purple-500/40 rounded-2xl p-4 flex gap-3 mb-8">
          <AlertCircle className="text-white mt-1" size={18} />
          <p className="text-gray-300 text-sm">
            Produk digital akan dikirim ke email & profile Anda setelah pembayaran berhasil diverifikasi.
          </p>
        </div>

        {/* BUTTON */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="flex-1 border border-purple-500 rounded-xl py-4"
          >
            Kembali
          </button>

          <button
            onClick={handleCreatePayment}
            disabled={processing || (selectedMethod === "wallet" && insufficientWallet)}
            className="flex-1 bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Lock size={18} />
            {processing ? "Memproses..." : "Proses Pembayaran"}
          </button>
        </div>

        {/* DETAIL */}
        <OrderDetail item={item} subtotal={subtotal} discount={discount} total={total} />
      </div>
    </main>
  );
}

/* ================= UI COMPONENTS ================= */

function StepHeader() {
  return (
    <div className="flex items-center gap-6 mb-10 text-sm">
      <Step done label="Langkah 1" title="Pilih Produk" />
      <Divider />
      <Step done label="Langkah 2" title="Lengkapi Data" />
      <Divider />
      <Step label="Langkah 3" title="Pembayaran" />
    </div>
  );
}

function Step({ done, label, title }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle
        size={20}
        className={done ? "text-green-400" : "text-gray-500"}
      />
      <div>
        <p className="text-purple-400">{label}</p>
        <p className="text-white">{title}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="flex-1 h-[1px] bg-purple-800" />;
}

function PaymentOption({ active, icon, title, desc, warning }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer ${
        active ? "border-purple-500 bg-purple-900/20" : "border-purple-800"
      }`}
    >
      <div className={`w-4 h-4 rounded-full ${active ? "bg-green-400" : "border border-white"}`} />
      {icon}
      <div>
        <p className="font-semibold">{title}</p>
        <p className={`text-sm ${warning ? "text-red-400" : "text-gray-400"}`}>
          {warning ? "Saldo tidak cukup" : desc}
        </p>
      </div>
    </div>
  );
}

function OrderDetail({ item, subtotal, discount, total }) {
  return (
    <div className="border border-purple-500/40 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-4">Detail Pesanan</h2>

      <div className="flex justify-between mb-2">
        <span>Sub Total</span>
        <span>Rp {subtotal.toLocaleString()}</span>
      </div>

      <div className="flex justify-between mb-4">
        <span>Diskon</span>
        <span>Rp {discount.toLocaleString()}</span>
      </div>

      <div className="flex justify-between text-xl font-bold text-green-400">
        <span>Total Bayar</span>
        <span>Rp {total.toLocaleString()}</span>
      </div>
    </div>
  );
}