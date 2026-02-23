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
  const [previewSummary, setPreviewSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [voucher, setVoucher] = useState("");
  const [voucherValid, setVoucherValid] = useState(null);

  const debounceRef = useRef(null);

  // animations
  const [flip, setFlip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  // ================= FETCH CART =================
  const fetchCart = async () => {
    try {
      const json = await authFetch("/api/v1/cart");

      setItems(json.data.items || []);
      setSummary(json.data.summary || null);
      setPreviewSummary(json.data.summary || null);

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

  // ================= PREVIEW VOUCHER =================
  const previewVoucher = async (code) => {
    try {
      setPreviewLoading(true);

      const query = code ? `?voucher_code=${code}` : "";
      const json = await authFetch(`/api/v1/cart/checkout${query}`);

      if (json.success) {
        setVoucherValid(true);
        setPreviewSummary(json.data.summary);

        // trigger confetti once
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1200);
      } else {
        setVoucherValid(false);
      }
    } catch (err) {
      setVoucherValid(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ================= DEBOUNCE =================
  const triggerPreview = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      previewVoucher(voucher);
    }, 400);
  };

  useEffect(() => {
    triggerPreview();
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

  const baseSubtotal = summary?.subtotal ?? 0;
  const baseTotal = summary?.total ?? baseSubtotal;

  const subtotal = previewSummary?.subtotal ?? 0;
  const discount = previewSummary?.discount_total ?? 0;
  const total = previewSummary?.total ?? subtotal;

  const savedAmount = Math.max(baseTotal - total, 0);

  // ================= FLIP TRIGGER =================
  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (prevTotalRef.current !== total) {
      setFlip(true);
      setTimeout(() => setFlip(false), 650);
      prevTotalRef.current = total;
    }
  }, [total]);

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
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* CONFETTI */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 25 }).map((_, i) => (
            <span key={i} className="confetti" />
          ))}
        </div>
      )}

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
                    hover:scale-[1.01]
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
                      Qty: {qty} • Stock: {stock}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      Rp {lineSubtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= RIGHT ================= */}
        <div className="space-y-6">

          {/* PREVIEW LABEL */}
          <div className="text-xs text-purple-400 bg-purple-500/10 border border-purple-700 rounded-xl px-3 py-2">
            ✨ Preview Mode (voucher belum diterapkan)
          </div>

          {/* VOUCHER */}
          <div className="rounded-2xl border border-purple-700 p-6">
            <div className="flex justify-between mb-2">
              <p className="text-sm text-gray-300">Kode Voucher</p>
              {previewLoading && (
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
              className="w-full rounded-xl bg-black border border-purple-700 px-3 py-2 text-sm outline-none focus:border-purple-500 transition"
            />

            {voucher && voucherValid === true && (
              <p className="text-green-400 text-xs mt-2 animate-fade-in">
                ✔ Voucher valid (preview)
              </p>
            )}

            {voucher && voucherValid === false && (
              <p className="text-red-400 text-xs mt-2 animate-fade-in">
                ✖ Voucher tidak valid
              </p>
            )}
          </div>

          {/* SUMMARY */}
          <div className="rounded-2xl border border-purple-700 p-6">
            <h3 className="text-xl font-semibold mb-6">Ringkasan</h3>

            <div className="space-y-3 text-sm">

              {discount > 0 && (
                <div className="text-xs text-gray-500 animate-fade-in">
                  <div className="flex justify-between">
                    <span>Sebelum Diskon</span>
                    <span className="line-through">
                      Rp {baseTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>Rp {subtotal.toLocaleString()}</span>
              </div>

              <div
                className={`flex justify-between text-green-400 discount-row ${
                  discount > 0 ? "show" : ""
                }`}
              >
                <span>Diskon</span>
                <span>- Rp {discount.toLocaleString()}</span>
              </div>

              <div className="border-t border-purple-700 pt-4 flex justify-between text-lg font-semibold">
                <span>Total</span>

                <span
                  className={`text-purple-400 flip-number ${
                    flip ? "flip glow" : ""
                  }`}
                >
                  Rp {total.toLocaleString()}
                </span>
              </div>

              {savedAmount > 0 && (
                <div className="saved-badge animate-fade-in">
                  💸 You saved Rp {savedAmount.toLocaleString()}
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || items.length === 0}
              className="mt-6 block w-full rounded-xl bg-purple-700 py-3 font-semibold hover:bg-purple-600 transition hover:scale-[1.02]"
            >
              {checkoutLoading
                ? "Memproses Checkout..."
                : "→ Lanjut Checkout"}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.35s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .flip-number {
          display: inline-block;
          transition: transform 0.6s ease;
        }

        .flip {
          transform: rotateX(360deg);
        }

        .glow {
          filter: blur(0.3px);
          text-shadow: 0 0 12px rgba(168, 85, 247, 0.8);
        }

        .discount-row {
          opacity: 0;
          transform: translateY(-6px);
          transition: all 0.4s ease;
        }

        .discount-row.show {
          opacity: 1;
          transform: translateY(0);
          animation: bounce 0.45s ease;
        }

        @keyframes bounce {
          0% { transform: translateY(-8px); }
          50% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }

        .saved-badge {
          margin-top: 8px;
          font-size: 12px;
          color: #22c55e;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          padding: 6px 10px;
          border-radius: 999px;
          text-align: center;
        }

        /* CONFETTI */
        .confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 6px;
          height: 10px;
          background: hsl(${Math.random() * 360}, 100%, 60%);
          top: -10px;
          left: ${Math.random() * 100}%;
          opacity: 0.7;
          animation: fall 1.2s linear forwards;
        }

        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}