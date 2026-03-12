"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { authFetch } from "../../../../../../lib/authFetch";
import {
  Wallet,
  CreditCard,
  Lock,
  AlertCircle,
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
  const searchParams = useSearchParams();

  const [checkout, setCheckout] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const subtotal = checkout?.summary?.subtotal ?? 0;
  const total = checkout?.summary?.total ?? 0;
  const discount = checkout?.summary?.discount_total ?? 0;

  /* ================= FETCH GATEWAYS ================= */

  const fetchGateways = async () => {
    try {
      const json = await authFetch(
        "/api/v1/payment-gateways/available?scope=order"
      );

      if (!json.success) return;

      const rows = Array.isArray(json.data) ? json.data : [];

      setGateways(rows);

      if (rows.length > 0) {
        setSelectedGateway(rows[0].code);
      }
    } catch (err) {
      console.error("gateway error", err);
    }
  };

  /* ================= MIDTRANS RETURN HANDLER ================= */

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const status = searchParams.get("transaction_status");

    if (!orderId || !status) return;

    const successStatuses = ["settlement", "capture", "success", "paid"];
    const failedStatuses = [
      "deny",
      "cancel",
      "expire",
      "failure",
      "refuse",
      "failed",
      "error",
    ];

    if (successStatuses.includes(status)) {
      router.replace(
        `/customer/category/product/detail/lengkapipembelian/methodpayment/success?order=${orderId}`
      );
      return;
    }

    if (failedStatuses.includes(status)) {
      router.replace(
        `/customer/category/product/detail/lengkapipembelian/methodpayment/failed?order=${orderId}`
      );
      return;
    }

    if (status === "pending") {
      router.replace(
        `/customer/category/product/detail/lengkapipembelian/methodpayment/process?order=${orderId}`
      );
    }
  }, [searchParams, router]);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    fetchCheckout();
    fetchWallet();
    fetchGateways();
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

  /* ================= CREATE PAYMENT ================= */

  const handleCreatePayment = async () => {
    if (!checkout || processing) return;

    setProcessing(true);

    try {
      const orderId = checkout.order.id;

      const json = await authFetch(`/api/v1/orders/${orderId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          gateway_code: selectedGateway,
        }),
      });

      if (!json.success) {
        alert(json.message);
        return;
      }

      const payload = json.data.payment_payload;

      /* MIDTRANS SNAP */
      if (payload?.snap_token && window.snap) {
        window.snap.pay(payload.snap_token);
        return;
      }

      /* REDIRECT GATEWAY */
      if (payload?.redirect_url) {
        window.location.href = payload.redirect_url;
        return;
      }

      /* WALLET FLOW */
      if (selectedGateway === "wallet") {
        router.push(
          `/customer/category/product/detail/lengkapipembelian/methodpayment/process?order=${orderId}&method=wallet`
        );
      }
    } catch (err) {
      console.error(err);
      alert("Pembayaran gagal");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= LOADING ================= */

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
      
      {/* MIDTRANS SCRIPT */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Pilih Metode Pembayaran
        </h1>

        <div className="space-y-3 mb-6">

          {/* PAYMENT GATEWAYS */}
          {gateways.map((g) => (
            <PaymentOption
              key={g.code}
              active={selectedGateway === g.code}
              onClick={() => setSelectedGateway(g.code)}
              icon={<CreditCard />}
              title={g.name}
              desc={g.description || "Pembayaran online"}
            />
          ))}

          {/* WALLET OPTION */}
          <PaymentOption
            active={selectedGateway === "wallet"}
            onClick={() => setSelectedGateway("wallet")}
            icon={<Wallet />}
            title="Wallet"
            desc={`Saldo tersedia Rp ${walletBalance.toLocaleString("id-ID")}`}
            warning={insufficientWallet}
          />
        </div>

        {/* INFO */}
        <div className="border border-purple-500/40 rounded-2xl p-4 flex gap-3 mb-8">
          <AlertCircle size={18} />
          <p className="text-sm text-gray-300">
            Produk digital akan dikirim setelah pembayaran berhasil.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="flex-1 border border-purple-500 rounded-xl py-4"
          >
            Kembali
          </button>

          <button
            onClick={handleCreatePayment}
            disabled={
              processing ||
              (selectedGateway === "wallet" && insufficientWallet)
            }
            className="flex-1 bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Lock size={18} />
            {processing ? "Memproses..." : "Proses Pembayaran"}
          </button>
        </div>

        <OrderDetail
          subtotal={subtotal}
          discount={discount}
          total={total}
        />
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
        active
          ? "border-purple-500 bg-purple-900/20"
          : "border-purple-800"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full ${
          active ? "bg-green-400" : "border border-white"
        }`}
      />

      {icon}

      <div>
        <p className="font-semibold">{title}</p>

        <p
          className={`text-sm ${
            warning ? "text-red-400" : "text-gray-400"
          }`}
        >
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