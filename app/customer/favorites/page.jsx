"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      const res = await fetch(`${API}/api/v1/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();

      if (json.success) {
        // karena paginate
        setFavorites(json?.data?.data || []);
      }
    } catch (err) {
      console.error("Failed fetch favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-8 py-10 text-white">
      <h1 className="text-2xl font-bold mb-8">❤️ Produk Favorit Saya</h1>

      {loading ? (
        <p className="text-white/60">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="text-white/60">Belum ada produk favorit.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const product = fav.product;

            return (
              <div
                key={fav.id}
                className="rounded-2xl border border-purple-700 bg-black overflow-hidden"
              >
                <div className="relative h-[160px] bg-white">
                  <Image
                    src={
                      product?.subcategory?.image_url ||
                      "/placeholder.png"
                    }
                    fill
                    alt={product?.name}
                    className="object-cover"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2">
                    {product?.name}
                  </h3>

                  {/* RATING */}
                  <div className="flex items-center text-yellow-400 text-sm mb-2">
                    <span className="mr-1">
                      {"★".repeat(Math.round(product?.rating || 0))}
                      {"☆".repeat(
                        5 - Math.round(product?.rating || 0)
                      )}
                    </span>

                    <span className="text-xs text-gray-400">
                      {product?.rating?.toFixed(1) || "0.0"} (
                      {product?.rating_count || 0})
                    </span>
                  </div>

                  <Link
                    href={`/customer/category/product/${product?.id}`}
                    className="block mt-3 text-sm bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-center transition"
                  >
                    Lihat Produk
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}