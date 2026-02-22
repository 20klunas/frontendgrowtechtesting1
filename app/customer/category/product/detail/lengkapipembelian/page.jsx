"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function StepTwo() {
  const [checkout, setCheckout] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckout();
  }, []);

  const fetchCheckout = async () => {
    try {
      const token = Cookies.get("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${API}/api/v1/cart/checkout`, {
        method: "POST", // karena backend kamu preview via POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voucher_code: null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn("Checkout fetch failed:", res.status, text);
        setCheckout(null);
        return;
      }

      const json = await res.json();

      if (json.success) {
        setCheckout(json.data);
        setQty(json.data.items?.[0]?.qty || 1);
      }
    } catch (err) {
      console.error("Fetch checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white">
        <p className="text-gray-400">Memuat data checkout...</p>
      </section>
    );
  }

  // ================= CHECKOUT KOSONG =================
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
  const discount = checkout.summary?.discount_total ?? 0;
  const taxPercent = checkout.summary?.tax_percent ?? 0;
  const taxAmount = checkout.summary?.tax_amount ?? 0;
  const total = checkout.summary?.total ?? 0;

  const updateQty = async (newQty) => {
    try {
      const token = Cookies.get("token");

      await fetch(`${API}/api/v1/cart/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qty: newQty }),
      });

      fetchCheckout(); // refresh summary backend
    } catch (err) {
      console.error("Update qty failed:", err);
    }
  };

  const handleMinus = () => {
    if (qty <= 1) return;
    updateQty(qty - 1);
  };

  const handlePlus = () => {
    if (qty >= stockAvailable) return;
    updateQty(qty + 1);
  };

  console.log("TOKEN:", Cookies.get("token"));
  console.log("API:", API);

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

        {/* QTY */}
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

      {/* SUMMARY */}
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