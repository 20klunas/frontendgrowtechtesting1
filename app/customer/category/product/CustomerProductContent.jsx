"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { cn } from "../../../lib/utils";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CustomerProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subcategoryId = searchParams.get("subcategory");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addingId, setAddingId] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);

  // ===== FAVORITES =====
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = useMemo(() => {
    return Math.ceil((products?.length || 0) / itemsPerPage);
  }, [products]);

  const paginatedProducts = useMemo(() => {
    return (products || []).slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [products, currentPage]);

  useEffect(() => {
    fetchProducts();
    fetchFavorites();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId]);

  /* ================= FETCH PRODUCTS ================= */
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
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH FAVORITES ================= */
  const fetchFavorites = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setFavoriteIds(new Set());
        return;
      }

      const res = await fetch(`${API}/api/v1/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return;

      const json = await res.json();
      if (json.success) {
        const ids = new Set((json.data || []).map((f) => f.product_id));
        setFavoriteIds(ids);
      }
    } catch (e) {
      console.error("fetchFavorites error:", e);
    }
  };

  /* ================= FAVORITE TOGGLE (hanya product_id) ================= */
  const toggleFavorite = async (productId) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setFavoriteLoadingId(productId);

      const isFav = favoriteIds.has(productId);

      if (!isFav) {
        // ADD favorite (tanpa rating)
        const res = await fetch(`${API}/api/v1/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ product_id: productId }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          alert(json?.error?.message || "Gagal menambahkan favorite");
          return;
        }

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      } else {
        // REMOVE favorite
        const res = await fetch(`${API}/api/v1/favorites/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          alert(json?.error?.message || "Gagal menghapus favorite");
          return;
        }

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } catch (e) {
      console.error("toggleFavorite error:", e);
      alert("Terjadi kesalahan");
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  /* ================= BUY NOW ================= */
  const handleBuyNow = async (productId) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setCheckoutLoadingId(productId);

      // 1) Add ke cart qty 1
      const addRes = await fetch(`${API}/api/v1/cart/items`, {
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

      if (!addRes.ok) {
        const text = await addRes.text();
        console.error("Add to cart failed:", addRes.status, text);
        alert("Gagal menambahkan produk");
        return;
      }

      // 2) Checkout
      const checkoutRes = await fetch(`${API}/api/v1/cart/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voucher_code: null,
        }),
      });

      if (!checkoutRes.ok) {
        const text = await checkoutRes.text();
        console.error("Checkout failed:", checkoutRes.status, text);
        alert("Checkout gagal");
        return;
      }

      // 3) Redirect
      router.push("/customer/category/product/detail/lengkapipembelian");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Buy now error:", err);
      alert("Terjadi kesalahan");
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  /* ================= ADD TO CART ================= */
  const addToCart = async (productId) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
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
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
      alert("Terjadi kesalahan");
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
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {loading ? (
          <>
            <SkeletonVariant />
            <SkeletonVariant />
            <SkeletonVariant />
          </>
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          paginatedProducts.map((product) => {
            const pricing = Array.isArray(product.tier_pricing)
              ? product.tier_pricing[0]
              : product.tier_pricing;

            const isAdding = addingId === product.id;
            const isOutOfStock = (product.available_stock ?? 0) <= 0;

            const isFav = favoriteIds.has(product.id);
            const favLoading = favoriteLoadingId === product.id;

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-purple-700 bg-black overflow-hidden"
              >
                {/* IMAGE + FAVORITE */}
                <div className="relative h-[160px] bg-white">
                  <Image
                    src={product?.subcategory?.image_url || "/placeholder.png"}
                    width={300}
                    height={200}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* FAVORITE BUTTON (hanya product_id) */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    disabled={favLoading}
                    className={cn(
                      "absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border transition select-none",
                      isFav
                        ? "bg-pink-500/20 border-pink-400 text-pink-400"
                        : "bg-black/40 border-white/20 text-white",
                      "disabled:opacity-60"
                    )}
                    title={isFav ? "Hapus dari Favorite" : "Tambah ke Favorite"}
                  >
                    {favLoading ? "⏳" : isFav ? "♥" : "♡"}
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-1">{product.name}</h3>

                  <p className="text-xs text-gray-400 mb-1">
                    Stok Tersedia {product.available_stock ?? 0}
                  </p>

                  {product.track_stock &&
                    product.available_stock <= product.stock_min_alert && (
                      <p className="text-xs text-red-400">⚠ Stok hampir habis</p>
                    )}

                  {/* RATING DISPLAY */}
                  <div className="flex items-center text-yellow-400 text-sm mb-2">
                    <span className="mr-1">
                      {"★".repeat(Math.round(product.rating || 0))}
                      {"☆".repeat(5 - Math.round(product.rating || 0))}
                    </span>

                    <span className="text-xs text-gray-400">
                      {product.rating?.toFixed(1) || "0.0"} (
                      {product.rating_count || 0})
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
                    <button
                      onClick={() => handleBuyNow(product.id)}
                      disabled={checkoutLoadingId === product.id || isOutOfStock}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-sm font-semibold transition relative",
                        isOutOfStock
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 text-white",
                        "disabled:opacity-70"
                      )}
                    >
                      {checkoutLoadingId === product.id
                        ? "Memproses..."
                        : isOutOfStock
                        ? "🔒 Stok Habis"
                        : "Beli Sekarang"}
                    </button>

                    {/* ADD TO CART */}
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={isAdding || isOutOfStock}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg border border-purple-600 hover:bg-purple-600/20 transition disabled:opacity-50",
                        isOutOfStock && "cursor-not-allowed opacity-50"
                      )}
                      title={isOutOfStock ? "Stok habis" : "Tambah ke keranjang"}
                    >
                      {isAdding ? "⏳" : "🛒"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-purple-700 text-purple-300 hover:bg-purple-700/30 disabled:opacity-40 transition"
          >
            ←
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition",
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-700/40"
                    : "bg-black text-purple-300 border border-purple-700 hover:bg-purple-700/30"
                )}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-purple-700 text-purple-300 hover:bg-purple-700/30 disabled:opacity-40 transition"
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}

/* ================= UI COMPONENTS ================= */

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