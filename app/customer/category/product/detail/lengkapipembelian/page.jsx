"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";

export default function StepTwo() {
  const [checkout, setCheckout] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckout();
  }, []);

  useEffect(() => {
    console.log("Checkout loaded:", checkout);
  }, [checkout]);

  const fetchCheckout = async () => {
    try {
      const json = await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({ voucher_code: null }),
      });

      if (json.success) {
        setCheckout(json.data);
        setQty(json.data.items?.[0]?.qty || 1);
      }
    } catch (err) {
      console.warn("Checkout fetch failed:", err.message);
      setCheckout(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white">
        <p className="text-gray-400">Memuat data checkout...</p>
      </section>
    );
  }

  if (!checkout || !checkout.items?.length) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white text-center">
        <p className="text-gray-400">Checkout kosong</p>

        <Link
          href="/customer/category/product/detail/cart"
          className="mt-4 inline-block px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 transition"
        >
          Kembali ke Keranjang
        </Link>
      </section>
    );
  }

  const item = checkout.items[0];
  const product = item.product;
  const unitPrice = item.unit_price ?? 0;

  const stockAvailable =
    item.stock_available ??
    product.stock ??
    999;

  const subtotal = checkout.summary?.subtotal ?? 0;
  const taxPercent = checkout.summary?.tax_percent ?? 0;
  const taxAmount = checkout.summary?.tax_amount ?? 0;
  const total = checkout.summary?.total ?? 0;

  const updateQty = async (newQty) => {
    if (newQty < 1) return;
    if (newQty > stockAvailable) return;

    try {
      await authFetch(`/api/v1/cart/items/${item.cart_item_id}`, {
        method: "PATCH",
        body: JSON.stringify({ qty: newQty }),
      });

      fetchCheckout();
    } catch (err) {
      console.error("Update qty failed:", err.message);
    }
  };

  const handleMinus = () => {
    if (qty <= 1) return;
    const newQty = qty - 1;
    setQty(newQty);     // ✅ optimistic UI
    updateQty(newQty);
  };

  const handlePlus = () => {
    if (qty >= stockAvailable) return;
    const newQty = qty + 1;
    setQty(newQty);     // ✅ optimistic UI
    updateQty(newQty);
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-white">
      <h1 className="mb-8 text-3xl font-bold">
        Lengkapi Data Pembelian
      </h1>

      <div className="mb-8 rounded-2xl border border-purple-800 bg-black p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-purple-700">
            <Image
              src={
                product?.subcategory?.image_url ||
                product?.image_url ||
                "/placeholder.png"
              }
              fill
              alt={product?.name}
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-400">
              Rp {unitPrice.toLocaleString()} / unit
            </p>
          </div>

          <div className="text-right font-semibold">
            Total :
            <span className="text-purple-400">
              Rp {(unitPrice * qty).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Jumlah Pembelian
          </span>

          <div className="flex items-center gap-3">
            <button onClick={handleMinus}>−</button>
            <div>{qty}</div>
            <button onClick={handlePlus}>+</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-800 bg-black p-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span>Pajak ({taxPercent}%)</span>
          <span>Rp {taxAmount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-purple-400">
            Rp {total.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
}