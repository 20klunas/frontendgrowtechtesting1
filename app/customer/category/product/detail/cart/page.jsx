"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = Cookies.get("token");

      if (!token) {
        console.warn("No token found");
        setUnauthorized(true);
        setItems([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/api/v1/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Cart error:", res.status, text);

        if (res.status === 401) {
          setUnauthorized(true);
        }

        setItems([]);
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Non JSON response:", text);
        setLoading(false);
        return;
      }

      const json = await res.json();

      if (json.success) {
        setItems(json?.data?.items || []);
        setSummary(json?.data?.summary || null);
      } else {
        console.warn("Cart response success=false", json);
        setItems([]);
      }
    } catch (err) {
      console.error("Failed fetch cart:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE QTY =================
  const updateQty = async (id, qty) => {
    if (qty < 1) return;

    try {
      const token = Cookies.get("token");
      if (!token) return;

      await fetch(`${API}/api/v1/cart/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qty }),
      });

      fetchCart();
    } catch (err) {
      console.error("Failed update qty:", err);
    }
  };

  // ================= REMOVE ITEM =================
  const removeItem = async (id) => {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      await fetch(`${API}/api/v1/cart/items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchCart();
    } catch (err) {
      console.error("Failed remove:", err);
    }
  };

  // ================= FALLBACK SUMMARY =================
  const subtotal =
    summary?.subtotal ??
    items.reduce((acc, item) => acc + (item.line_subtotal || 0), 0);

  const total = summary?.total ?? subtotal;

  // ================= UNAUTHORIZED VIEW =================
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
              const lineSubtotal = item.line_subtotal || 0;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-purple-700 p-6 flex items-center gap-6"
                >
                  {/* IMAGE */}
                  <div className="h-20 w-20 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Image
                      src={product?.subcategory?.image_url || "/placeholder.png"}
                      alt={product?.name}
                      width={48}
                      height={48}
                    />
                  </div>

                  {/* INFO */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {product?.name}
                    </h3>

                    <p className="text-sm text-gray-400">
                      Rp {unitPrice.toLocaleString()} / item
                    </p>

                    <p className="text-sm text-gray-500">
                      Stock Tersedia: {item.stock_available ?? 0}
                    </p>

                    {/* QTY */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="h-8 w-8 rounded bg-white text-black font-bold"
                      >
                        −
                      </button>

                      <span className="min-w-[32px] text-center">
                        {item.qty}
                      </span>

                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="h-8 w-8 rounded bg-white text-black font-bold"
                        disabled={!item.can_buy}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="text-right space-y-2">
                    <p className="text-sm text-gray-400">Harga</p>
                    <p className="font-semibold">
                      Rp {lineSubtotal.toLocaleString()}
                    </p>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="rounded-2xl border border-purple-700 p-6 h-fit">
          <h3 className="text-xl font-semibold mb-6">Ringkasan</h3>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>

            {summary?.discount_total > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Diskon</span>
                <span className="text-red-400">
                  -Rp {summary.discount_total.toLocaleString()}
                </span>
              </div>
            )}

            {summary?.tax_percent > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">
                  Pajak ({summary.tax_percent}%)
                </span>
                <span>
                  Rp {summary.tax_amount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="border-t border-purple-700 pt-4 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-purple-400">
                Rp {total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/customer/checkout/detail"
              className="block w-full rounded-xl bg-purple-700 py-3 text-center font-semibold hover:bg-purple-600 transition"
            >
              → Lanjut Checkout
            </Link>

            <Link
              href="/customer/product"
              className="block w-full rounded-xl bg-white py-3 text-center font-semibold text-black hover:bg-gray-200 transition"
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}