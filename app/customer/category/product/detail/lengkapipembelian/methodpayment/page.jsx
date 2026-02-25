"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authFetch } from "../../../../../../lib/authFetch";
import {
  Wallet,
  CreditCard,
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
  const [selectedMethod, setSelectedMethod] = useState("midtrans");
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

      if (!json.success) {
        alert(json.message);
        return;
      }

      const payment = json.data.payment;

      /* MIDTRANS FLOW */
      if (selectedMethod === "midtrans") {
        const snapUrl =
          payment?.raw_callback?.redirect_url ||
          json?.data?.snap?.redirect_url;

        if (snapUrl) {
          window.location.href = snapUrl; // auto open midtrans
        } else {
          console.error("Payment JSON:", json);
          alert("Snap URL tidak ditemukan");
        }
        return;
      }

      /* WALLET FLOW */
      if (selectedMethod === "wallet") {
        router.push(
          `/customer/category/product/detail/lengkapipembelian/methodpayment/process?order=${orderId}&method=wallet`
        );
      }
    } catch {
      console.error(err);
      alert("Pembayaran gagal");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading checkout...
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

        <h1 className="text-4xl font-bold mb-8">
          Pilih Metode Pembayaran
        </h1>

        <div className="space-y-3 mb-6">

          <PaymentOption
            active={selectedMethod === "midtrans"}
            onClick={() => setSelectedMethod("midtrans")}
            icon={<CreditCard />}
            title="Midtrans"
            desc="Bayar via QRIS / Bank / E-Wallet"
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

        <div className="border border-purple-500/40 rounded-2xl p-4 flex gap-3 mb-8">
          <AlertCircle size={18} />
          <p className="text-sm text-gray-300">
            Produk digital akan dikirim setelah pembayaran berhasil.
          </p>
        </div>

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

        <OrderDetail subtotal={subtotal} discount={discount} total={total} />
      </div>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function PaymentOption({ active, icon, title, desc, warning, onClick }) {
  return (
    <div
      onClick={onClick} 
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

function OrderDetail({ subtotal, discount, total }) {
  return (
    <div className="border border-purple-500/40 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-4">Detail Pesanan</h2>

      <Row label="Sub Total" value={`Rp ${subtotal.toLocaleString()}`} />
      <Row label="Diskon" value={`Rp ${discount.toLocaleString()}`} />

      <div className="flex justify-between text-xl font-bold text-green-400 mt-4">
        <span>Total Bayar</span>
        <span>Rp {total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-gray-300">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}