"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CustomerProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subcategoryId = searchParams.get("subcategory");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null); // 🔥 loading per item

  useEffect(() => {
    fetchProducts();
  }, [subcategoryId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const url = subcategoryId
        ? `${API}/api/v1/products?subcategory_id=${subcategoryId}`
        : `${API}/api/v1/products`;

      const res = await fetch(url);

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
    } finally {
      setLoading(false);
    }
  };

  // ================= ADD TO CART =================
  const addToCart = async (productId) => {
    try {
      const token = Cookies.get("token");

      if (!token) {
        console.warn("User belum login");
        router.push("/login");
        return;
      }

      setAddingId(productId);

      const res = await fetch(`${API}/api/v1/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          qty: 1,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Add to cart error:", res.status, text);
        alert("Gagal menambahkan ke keranjang");
        return;
      }

      const json = await res.json();

      if (json.success) {
        console.log("Produk masuk keranjang");

        // Trigger event biar navbar update badge realtime
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setAddingId(null);
    }
  };

  const header = products?.[0];

  return (
    <section className="max-w-6xl mx-auto px-8 py-10 text-white">
      
      {/* ================= HEADER ================= */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="rounded-xl overflow-hidden border border-purple-700">
          <Image
            src={header?.subcategory?.image_url || "/placeholder.png"}
            width={600}
            height={360}
            alt="Header"
            className="w-full h-[260px] object-cover"
            priority
          />
        </div>

        <div>
          <span className="inline-block mb-2 text-xs font-medium text-purple-400 uppercase tracking-wide">
            {header?.category?.name || "Kategori"}
          </span>

          <h1 className="text-2xl font-bold text-purple-300 mb-3">
            {header?.subcategory?.name || "Produk"}
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed">
            {header?.subcategory?.description ||
              "Deskripsi subkategori akan tampil di sini"}
          </p>
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <SkeletonVariant />
            <SkeletonVariant />
            <SkeletonVariant />
          </>
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          products.map((product) => {
            const pricing = Array.isArray(product.tier_pricing)
              ? product.tier_pricing[0]
              : product.tier_pricing;

            const isAdding = addingId === product.id;

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-purple-700 bg-black overflow-hidden"
              >
                <div className="h-[160px] bg-white">
                  <Image
                    src={product?.subcategory?.image_url || "/placeholder.png"}
                    width={300}
                    height={200}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-gray-400 mb-1">
                    Stok Tersedia {product.available_stock ?? 0}
                  </p>

                  {product.track_stock && product.available_stock <= product.stock_min_alert && (
                    <p className="text-xs text-red-400">
                      ⚠ Stok hampir habis
                    </p>
                  )}

                  <div className="flex items-center text-yellow-400 text-sm mb-2">
                    <span className="mr-1">
                      {"★".repeat(Math.round(product.rating || 0))}
                      {"☆".repeat(5 - Math.round(product.rating || 0))}
                    </span>

                    <span className="text-xs text-gray-400">
                      {product.rating?.toFixed(1) || "0.0"} ({product.rating_count || 0})
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white">
                      Rp {pricing?.member?.toLocaleString() || "-"}
                    </span>

                    <span className="text-xs px-2 py-1 rounded bg-purple-800 text-purple-200">
                      {product.type || "Otomatis"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href="/customer/checkout/detail"
                      className="flex-1 text-center rounded-lg bg-purple-600 py-2 text-sm font-semibold hover:bg-purple-700 transition"
                    >
                      Beli Sekarang
                    </Link>

                    {/* 🛒 ADD TO CART */}
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={isAdding}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-purple-600 hover:bg-purple-600/20 transition disabled:opacity-50"
                    >
                      {isAdding ? "⏳" : "🛒"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function SkeletonVariant() {
  return (
    <div className="rounded-2xl border border-purple-700 bg-black overflow-hidden animate-pulse">
      <div className="h-[160px] bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-20 text-zinc-500">
      Tidak ada produk
    </div>
  );
}