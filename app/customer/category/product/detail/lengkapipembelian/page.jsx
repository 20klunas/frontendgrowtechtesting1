"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function StepTwo() {
  const [checkout, setCheckout] = useState(null);
  const [qty, setQty] = useState(1);
  const [voucher, setVoucher] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("checkout");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);

      // ✅ Struktur BARU → langsung parsed.items & parsed.summary
      const normalized = {
        items: parsed.items || [],
        summary: parsed.summary || {},
        wallet_balance: parsed.wallet_balance ?? 0,
      };

      setCheckout(normalized);

      const firstItem = parsed.items?.[0];
      setQty(firstItem?.qty || 1);

    } catch (err) {
      console.error("Failed parsing checkout:", err);
    }
  }, []);

  if (!checkout) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white">
        <p className="text-gray-400">Memuat data checkout...</p>
      </section>
    );
  }

  const item = checkout.items?.[0];
  const product = item?.product;

  const unitPrice = item?.unit_price ?? 0;
  const stockAvailable = item?.stock_available ?? 0;

  // ✅ Gunakan SUMMARY dari backend (NO manual calc)
  const subtotal = checkout.summary?.subtotal ?? 0;
  const discount = checkout.summary?.discount_total ?? 0;
  const taxPercent = checkout.summary?.tax_percent ?? 0;
  const taxAmount = checkout.summary?.tax_amount ?? 0;
  const total = checkout.summary?.total ?? 0;

  const handleMinus = () => {
    if (qty <= 1) return;
    setQty(qty - 1);
  };

  const handlePlus = () => {
    if (qty >= stockAvailable) return;
    setQty(qty + 1);
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-white">

      <h1 className="mb-8 text-3xl font-bold">
        Lengkapi Data Pembelian
      </h1>

      {/* ================= PRODUK ================= */}
      <div className="mb-8 rounded-2xl border border-purple-800 bg-black p-6">

        <h3 className="mb-4 text-lg font-semibold">
          Produk Yang Dipilih
        </h3>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-purple-700">
            <Image
              src={product?.subcategory?.image_url || "/placeholder.png"}
              fill
              alt={product?.name}
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <p className="font-medium">
              {product?.name || "Produk"}
            </p>

            <p className="text-sm text-gray-400">
              Rp {unitPrice.toLocaleString()} / unit
            </p>

            {/* ⭐ Rating dari backend */}
            <p className="text-xs text-yellow-400">
              ⭐ {product?.rating?.toFixed(1) || "0.0"} ({product?.rating_count || 0})
            </p>
          </div>

          <div className="text-right font-semibold">
            Total :{" "}
            <span className="text-purple-400">
              Rp {(unitPrice * qty).toLocaleString()}
            </span>
          </div>
        </div>

        {/* ================= QTY ================= */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Jumlah Pembelian
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMinus}
              className="h-9 w-9 rounded-full bg-gray-200 text-black font-bold hover:scale-110 transition"
            >
              −
            </button>

            <div className="flex items-center gap-1 rounded-full bg-gray-200 px-4 py-1 text-black">
              <span className="font-semibold">{qty}</span>
              <span className="text-xs">↕</span>
            </div>

            <button
              onClick={handlePlus}
              disabled={qty >= stockAvailable}
              className="h-9 w-9 rounded-full bg-gray-200 text-black font-bold hover:scale-110 transition disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Stock tersedia: {stockAvailable}
        </p>

        {/* ⚠ Stock alert */}
        {product?.track_stock && stockAvailable <= product?.stock_min_alert && (
          <p className="text-xs text-red-400 mt-1">
            ⚠ Stok hampir habis
          </p>
        )}
      </div>

      {/* ================= VOUCHER ================= */}
      <div className="mb-8 rounded-2xl border border-purple-800 bg-black p-6">
        <div className="mb-3 flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            Kode Voucher / Promo
          </h3>
          <span className="rounded-full bg-white px-3 py-0.5 text-xs text-black">
            Optional
          </span>
        </div>

        <input
          value={voucher}
          onChange={(e) => setVoucher(e.target.value)}
          placeholder="Contoh: PROMO5K"
          className="w-full rounded-lg border border-purple-800 bg-black px-4 py-3 text-sm outline-none focus:border-purple-500"
        />
      </div>

      {/* ================= SALDO ================= */}
      <div className="mb-10 rounded-2xl border border-purple-800 bg-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">
              Saldo Wallet
            </h3>
            <p className="text-sm text-gray-400">
              Gunakan Saldo Wallet
            </p>
            <p className="text-sm text-gray-400">
              Saldo Tersedia: Rp {(checkout.wallet_balance || 0).toLocaleString()}
            </p>
          </div>

          <Link
            href="/customer/topup"
            className="rounded-full bg-purple-700 px-6 py-2 text-sm font-medium hover:bg-purple-600 transition"
          >
            Top up
          </Link>
        </div>
      </div>

      {/* ================= ACTION ================= */}
      <div className="mb-10 flex items-center gap-6">
        <Link
          href="/customer/category/product/detail/cart"
          className="flex-1 rounded-xl border border-purple-700 py-3 text-center hover:bg-purple-900/40 transition"
        >
          Kembali
        </Link>

        <Link
          href="/customer/category/product/detail/lengkapipembelian/methodpayment"
          className="flex-1 rounded-xl bg-purple-700 py-3 text-center font-semibold hover:bg-purple-600 transition hover:scale-[1.02]"
        >
          Lanjut Ke Pembayaran &gt;
        </Link>
      </div>

      {/* ================= RINGKASAN ================= */}
      <div className="rounded-2xl border border-purple-800 bg-black p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Ringkasan
        </h3>

        <div className="space-y-2 text-sm">

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>Diskon</span>
            <span>Rp {discount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>Pajak ({taxPercent}%)</span>
            <span>Rp {taxAmount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between border-t border-purple-800 pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-purple-400">
              Rp {total.toLocaleString()}
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}