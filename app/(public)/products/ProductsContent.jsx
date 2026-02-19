"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subcategoryId = searchParams.get("subcategory");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // 🚨 Guard response bukan JSON
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

  const handleBuy = (product) => {
    router.push("/login");
  };

  return (
    <main className="product-wrapper">
      <h1 className="product-title">
        {subcategoryId ? "Produk Subkategori" : "Semua Produk"}
      </h1>

      <div className="product-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          products.map((product) => {
            const pricing =
              Array.isArray(product.tier_pricing)
                ? product.tier_pricing[0]
                : product.tier_pricing;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.03 }}
                className="group relative rounded-2xl p-5 bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 shadow-lg"
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/10 blur-2xl" />

                <div className="relative space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    {product.name}
                  </h3>

                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {product.description}
                  </p>

                  {product.duration_days && (
                    <p className="text-xs text-zinc-500">
                      Durasi: {product.duration_days} hari
                    </p>
                  )}

                  {/* Harga */}
                  {pricing?.member && (
                    <div className="pt-2 text-sm">
                      <p className="text-purple-400 font-medium">
                        Harga mulai:
                      </p>
                      <p className="text-white font-semibold">
                        Rp {pricing.member.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleBuy(product)}
                    className="mt-3 w-full rounded-lg bg-purple-600 hover:bg-purple-500 transition py-2.5 text-sm font-medium text-white shadow-md hover:shadow-purple-500/40"
                  >
                    Beli Sekarang
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </main>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 animate-pulse">
      <div className="h-5 w-3/4 bg-zinc-800 rounded mb-3" />
      <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
      <div className="h-4 w-5/6 bg-zinc-800 rounded mb-4" />
      <div className="h-3 w-1/3 bg-zinc-800 rounded mb-4" />
      <div className="h-10 w-full bg-zinc-800 rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-20 text-zinc-500">
      <p className="text-lg">Tidak ada produk</p>
      <p className="text-sm">
        Produk untuk filter ini belum tersedia
      </p>
    </div>
  );
}
