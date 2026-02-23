"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "../../../../../lib/authFetch";

export default function CartPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [voucher, setVoucher] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherValid, setVoucherValid] = useState(null); // null | true | false
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchCart();
  }, []);

  // ================= FETCH CART =================
  const fetchCart = async () => {
    try {
      const json = await authFetch("/api/v1/cart");

      setItems(json.data.items || []);
      setSummary(json.data.summary || null);
      setUnauthorized(false);
    } catch (err) {
      console.error("Fetch cart error:", err.message);

      if (err.message.includes("Unauthorized")) {
        setUnauthorized(true);
      }

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE QTY =================
  const updateQty = async (id, qty, stock) => {
    if (qty < 1) return;
    if (qty > stock) return;

    try {
      await authFetch(`/api/v1/cart/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ qty }),
      });

      fetchCart();
      triggerVoucherRecalc(qty);
    } catch (err) {
      console.error("Update qty error:", err.message);
    }
  };

  // ================= REMOVE ITEM =================
  const removeItem = async (id) => {
    try {
      await authFetch(`/api/v1/cart/items/${id}`, {
        method: "DELETE",
      });

      fetchCart();
      triggerVoucherRecalc();
    } catch (err) {
      console.error("Remove item error:", err.message);
    }
  };

  // ================= APPLY VOUCHER =================
  const applyVoucher = async (code) => {
    try {
      setApplyingVoucher(true);

      const json = await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          voucher_code: code || null,
        }),
      });

      if (json.success) {
        setVoucherValid(true);
        fetchCart();
      } else {
        setVoucherValid(false);
      }
    } catch (err) {
      setVoucherValid(false);
    } finally {
      setApplyingVoucher(false);
    }
  };

  // ================= DEBOUNCE AUTO APPLY =================
  const triggerVoucherRecalc = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      applyVoucher(voucher);
    }, 500); // debounce 500ms
  };

  useEffect(() => {
    triggerVoucherRecalc();
    return () => clearTimeout(debounceRef.current);
  }, [voucher]);

  // ================= CHECKOUT =================
  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

      await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          voucher_code: voucher || null,
        }),
      });

      router.push("/customer/category/product/detail/lengkapipembelian");
    } catch (err) {
      console.error("Checkout error:", err.message);
      alert(err.message || "Checkout gagal");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = summary?.subtotal ?? 0;
  const discount = summary?.discount_total ?? 0;
  const total = summary?.total ?? subtotal;

  // ================= UNAUTHORIZED =================
  if (!loading && unauthorized) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">
          Kamu harus login untuk melihat keranjang
        </p>

        <Link
          href="/login"
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition"
        >
          Login Sekarang
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 pt-10">
        <h1 className="text-4xl font-bold mb-10">Keranjang</h1>
      </div>

      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ================= LEFT ================= */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <p className="text-gray-400">Loading cart...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500">Keranjang kosong</p>
          ) : (
            items.map((item) => {
              const product = item.product;
              const unitPrice = item.unit_price || 0;
              const qty = item.qty || 1;
              const stock = item.stock_available ?? 0;
              const lineSubtotal = item.line_subtotal || 0;

              return (
                <div
                  key={item.id}
                  className="
                    rounded-2xl border border-purple-700 p-6
                    flex items-center gap-6
                    transition-all duration-300
                    hover:border-purple-500
                    hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]
                  "
                >
                  <div className="h-20 w-20 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Image
                      src={product?.subcategory?.image_url || "/placeholder.png"}
                      alt={product?.name}
                      width={48}
                      height={48}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {product?.name}
                    </h3>

                    <p className="text-sm text-gray-400">
                      Rp {unitPrice.toLocaleString()} / item
                    </p>

                    <p className="text-sm text-gray-500">
                      Stock Tersedia: {stock}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => updateQty(item.id, qty - 1, stock)}
                        disabled={qty <= 1}
                        className="h-9 w-9 rounded-lg bg-white text-black font-bold"
                      >
                        −
                      </button>

                      <span className="min-w-[24px] text-center font-semibold">
                        {qty}
                      </span>

                      <button
                        onClick={() => updateQty(item.id, qty + 1, stock)}
                        disabled={qty >= stock}
                        className="h-9 w-9 rounded-lg bg-white text-black font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-sm text-gray-400">Harga</p>
                    <p className="font-semibold">
                      Rp {lineSubtotal.toLocaleString()}
                    </p>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="space-y-6">

          {/* VOUCHER INPUT */}
          <div className="rounded-2xl border border-purple-700 p-6">
            <div className="flex justify-between mb-2">
              <p className="text-sm text-gray-300">Kode Voucher</p>
              {applyingVoucher && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Mengecek...
                </span>
              )}
            </div>

            <input
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              placeholder="Contoh: PROMO5K"
              className="
                w-full rounded-xl bg-black border border-purple-700
                px-3 py-2 text-sm outline-none
                focus:border-purple-500
              "
            />

            {/* Voucher Status */}
            {voucher && voucherValid === true && (
              <p className="text-green-400 text-xs mt-2 animate-fade-in">
                ✔ Voucher valid
              </p>
            )}

            {voucher && voucherValid === false && (
              <p className="text-red-400 text-xs mt-2 animate-fade-in">
                ✖ Voucher tidak valid
              </p>
            )}
          </div>

          {/* SUMMARY */}
          <div className="rounded-2xl border border-purple-700 p-6 h-fit">
            <h3 className="text-xl font-semibold mb-6">Ringkasan</h3>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>Rp {subtotal.toLocaleString()}</span>
              </div>

              {/* DISCOUNT ANIMATION */}
              <div
                className={`
                  flex justify-between text-green-400
                  transition-all duration-500
                  ${discount > 0
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 h-0 overflow-hidden"}
                `}
              >
                <span>Diskon</span>
                <span>- Rp {discount.toLocaleString()}</span>
              </div>

              <div className="border-t border-purple-700 pt-4 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-purple-400">
                  Rp {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CHECKOUT BUTTON */}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || items.length === 0}
              className="
                block w-full rounded-xl bg-purple-700 py-3
                text-center font-semibold
                transition-all duration-300
                hover:bg-purple-600 hover:scale-[1.02]
                disabled:opacity-50
              "
            >
              {checkoutLoading
                ? "Memproses Checkout..."
                : "→ Lanjut Checkout"}
            </button>

            <Link
              href="/customer/product"
              className="
                mt-3 block w-full rounded-xl bg-white py-3
                text-center font-semibold text-black
                transition hover:bg-gray-200
              "
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>
      </section>

      {/* Tailwind Animation Helper */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}