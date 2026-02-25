"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { authFetch } from "../../../../../lib/authFetch";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function StepTwo() {
  const [checkout, setCheckout] = useState(null);
  const [qty, setQty] = useState(1);
  // const [voucher, setVoucher] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [products, setProducts] = useState([]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  // const [applyingVoucher, setApplyingVoucher] = useState(false);

  const handleGoPayment = () => {
    router.push("/customer/category/product/detail/lengkapipembelian/methodpayment");
  };

  useEffect(() => {
    fetchCheckout();
    fetchWallet();
    fetchProducts();
  }, []);

  // ================= FETCH CHECKOUT =================
  const fetchCheckout = async () => {
    try {
      const json = await authFetch("/api/v1/cart/checkout");

      if (json.success) {
        setCheckout(json.data);
        setQty(json.data.items?.[0]?.qty || 1);
      }
    } catch (err) {
      console.warn("Checkout preview failed:", err.message);
      setCheckout(null);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH WALLET =================
  const fetchWallet = async () => {
    try {
      const json = await authFetch("/api/v1/wallet/summary");

      if (json.success) {
        setWalletBalance(json.data.wallet?.balance ?? 0);
      }
    } catch (err) {
      console.warn("Wallet fetch failed:", err.message);
      setWalletBalance(0);
    }
  };

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/v1/products`);

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("API did not return JSON");
      }

      const json = await res.json();

      if (json.success) {
        setProducts(json?.data?.data || []);
      }
    } catch (err) {
      console.error("Failed fetch products:", err);
      setProducts([]);
    }
  };

  // ================= APPLY VOUCHER =================
  // const applyVoucher = async () => {
  //   if (!voucher.trim()) {
  //     fetchCheckout();
  //     return;
  //   }

  //   try {
  //     setApplyingVoucher(true);

  //     const json = await authFetch("/api/v1/cart/checkout", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         voucher_code: voucher,
  //       }),
  //     });

  //     if (json.success) {
  //       setCheckout(json.data);
  //     }
  //   } catch (err) {
  //     alert(err.message || "Voucher tidak valid");
  //     fetchCheckout();
  //   } finally {
  //     setApplyingVoucher(false);
  //   }
  // };

  // ================= UPDATE QTY =================
  const updateQty = async (newQty) => {
    if (!checkout) return;

    const item = checkout.items[0];
    const stockAvailable = item.stock_available ?? 0;

    if (newQty < 1) return;
    if (newQty > stockAvailable) return;

    setQty(newQty); // optimistic UI

    try {
      await fetch(`${API}/api/v1/cart/items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: item.id,
          qty: newQty,
        }),
      });

      fetchCheckout();
    } catch (err) {
      console.error("Update qty failed:", err.message);
      fetchCheckout();
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
  const stockAvailable = item.stock_available ?? 0;

  // ================= IMAGE FROM PRODUCTS API =================
  const matchedProduct = products.find(p => p.id === product?.id);

  const productImage =
    matchedProduct?.subcategory?.image_url ||
    matchedProduct?.image_url ||
    product?.subcategory?.image_url ||
    product?.image_url ||
    "/placeholder.png";

  const subtotal = checkout.summary?.subtotal ?? 0;
  const discount = checkout.summary?.discount_total ?? 0;
  const taxPercent = checkout.summary?.tax_percent ?? 0;
  const taxAmount = checkout.summary?.tax_amount ?? 0;
  const total = checkout.summary?.total ?? 0;

  return (
    <section className="max-w-5xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-10">
        Lengkapi Data Pembelian
      </h1>

      {/* ================= PRODUK ================= */}
      <div className="rounded-2xl border border-purple-800 bg-black p-6 mb-6">
        <p className="text-sm text-gray-400 mb-4">Produk Yang Dipilih</p>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-purple-700">
            <Image
              src={productImage}
              fill
              alt={product?.name}
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <p className="font-medium">{product?.name}</p>
            <p className="text-sm text-gray-400">
              Rp {unitPrice.toLocaleString()} / unit
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-purple-400 font-semibold">
              Rp {(unitPrice * qty).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ================= QTY ================= */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Jumlah Pembelian
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => updateQty(qty - 1)}
              disabled={qty <= 1}
              className="h-8 w-8 rounded-full bg-white text-black"
            >
              −
            </button>

            <div className="min-w-[24px] text-center">{qty}</div>

            <button
              onClick={() => updateQty(qty + 1)}
              disabled={qty >= stockAvailable}
              className="h-8 w-8 rounded-full bg-white text-black"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ================= SALDO ================= */}
      <div className="rounded-2xl border border-purple-800 bg-black p-6 mb-8 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-300">Saldo Wallet</p>
          <p className="text-xs text-gray-500">
            Saldo Tersedia: Rp {walletBalance.toLocaleString("id-ID")}
          </p>
        </div>

        <Link
          href="/customer/topup"
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-sm"
        >
          Top Up
        </Link>
      </div>

      {/* ================= BUTTONS ================= */}
      <div className="flex gap-4 mb-8">
        <Link
          href="/customer/category/product/detail/cart"
          className="flex-1 text-center py-3 rounded-xl border border-purple-700 hover:bg-purple-700/20"
        >
          Kembali
        </Link>

        <button
          onClick={handleGoPayment}
          className="flex-1 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 font-semibold"
        >
          Lanjut Ke Pembayaran →
        </button>
      </div>

      {/* ================= RINGKASAN ================= */}
      <div className="rounded-2xl border border-purple-800 bg-black p-6">
        <h3 className="font-semibold mb-4">Ringkasan</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Harga Unit</span>
            <span>Rp {unitPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Jumlah</span>
            <span>{qty}x</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Sub Total</span>
            <span>Rp {subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Tax ({taxPercent}%)</span>
            <span>Rp {taxAmount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Diskon</span>
            <span>Rp {discount.toLocaleString()}</span>
          </div>

          <div className="border-t border-purple-800 pt-3 flex justify-between font-semibold">
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