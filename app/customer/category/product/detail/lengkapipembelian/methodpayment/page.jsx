"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import {
  CreditCard,
  Wallet,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();

  const [checkout, setCheckout] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [loading, setLoading] = useState(true);

  const subtotal = checkout?.summary?.subtotal ?? 0;
  const total = checkout?.summary?.total ?? 0;
  const discount = checkout?.summary?.discount_total ?? 0;

  const item = checkout?.items?.[0];

  useEffect(() => {
    fetchCheckout();
  }, []);

  const fetchCheckout = async () => {
    try {
      const json = await authFetch("/api/v1/cart/checkout");

      if (json.success) {
        setCheckout(json.data);
      }
    } catch (err) {
      console.warn("Checkout fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!checkout) return;

    try {
      const orderId = checkout.order.id;

      const json = await authFetch(`/api/v1/orders/${orderId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          method: selectedMethod,
        }),
      });

      if (json.success) {
        router.push(`./process?order=${orderId}&method=${selectedMethod}`);
      } else {
        alert(json.message || "Gagal membuat pembayaran");
      }
    } catch (err) {
      alert("Pembayaran gagal");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading checkout...
      </main>
    );
  }

  return (
    <main className="bg-black min-h-screen px-4 pb-24 text-white">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Pilih Metode Pembayaran
        </h1>

        {/* PAYMENT OPTIONS */}
        <div className="space-y-4 mb-10">

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
            desc={`Saldo: Rp ${checkout?.wallet_balance?.toLocaleString?.() || 0}`}
          />

          <div className="border border-purple-500/40 rounded-2xl p-5 flex gap-3">
            <AlertCircle className="text-white mt-1" />
            <p className="text-gray-300 text-sm">
              Produk digital akan dikirim ke email & profile Anda setelah pembayaran berhasil.
            </p>
          </div>
        </div>

        {/* ACTION */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={() => router.back()}
            className="flex-1 border border-purple-500 rounded-xl py-4 hover:bg-purple-500/10"
          >
            Kembali
          </button>

          <button
            onClick={handleCreatePayment}
            className="flex-1 bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl py-4 font-semibold flex items-center justify-center gap-2"
          >
            <Lock size={18} />
            Proses Pembayaran
          </button>
        </div>

        {/* ORDER DETAIL */}
        <div className="border border-purple-500/40 rounded-3xl p-8">
          <h2 className="text-3xl font-bold mb-6">
            Detail Pesanan
          </h2>

          <div className="flex items-center gap-4 pb-6 border-b border-purple-500/30">
            <Image
              src={item?.product?.image || "/product/default.png"}
              alt="product"
              width={64}
              height={64}
              className="rounded-xl"
            />

            <div className="flex-1">
              <p className="font-semibold">
                {item?.product?.name}
              </p>
              <p className="text-gray-400 text-sm">
                Qty : {item?.qty}
              </p>
            </div>

            <p className="font-semibold">
              Rp {item?.subtotal?.toLocaleString()}
            </p>
          </div>

          <div className="py-6 space-y-3 border-b border-purple-500/30">
            <Row label="Sub Total" value={`Rp ${subtotal.toLocaleString()}`} />
            <Row label="Diskon" value={`Rp ${discount.toLocaleString()}`} />
            <p className="text-xl font-bold">
              Rp {total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function PaymentOption({ active, icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer ${
        active
          ? "border-purple-500 bg-purple-500/10"
          : "border-purple-500/40"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full ${
          active ? "bg-green-400" : "border border-white"
        }`}
      />
      {icon}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-300">
      <p>{label}</p>
      <p>{value}</p>
    </div>
  );
}