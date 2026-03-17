"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../hooks/useAuth";
import { authFetch } from "../../../lib/authFetch";
import { notifyCustomerCartChanged } from "../../../lib/customerCartEvents";

const SORT_OPTIONS = [
  { value: "latest", label: "Terbaru" },
  { value: "bestseller", label: "Terlaris" },
  { value: "favorite", label: "Favorit" },
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Top Rated" },
];

export default function CustomerProductContent({
  initialProducts = [],
  initialHeader = {},
  initialSort = "latest",
  subcategoryId = null,
  maintenanceMessage = "",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, loading: authLoading } = useAuth();

  const [addingId, setAddingId] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isSortPending, startSortTransition] = useTransition();

  const itemsPerPage = 6;
  const products = Array.isArray(initialProducts) ? initialProducts : [];
  const header = initialHeader || {};
  const catalogDisabled = Boolean(maintenanceMessage);

  const userTier = user?.tier?.toLowerCase() || "guest";

  useEffect(() => {
    setCurrentPage(1);
  }, [subcategoryId, initialSort]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (authLoading) return;

        if (!user) {
          setFavoriteIds(new Set());
          return;
        }

        const json = await authFetch("/api/v1/favorites");

        if (json?.success) {
          const favoritesArray = Array.isArray(json?.data?.data)
            ? json.data.data
            : [];

          const ids = new Set(favoritesArray.map((item) => item.product_id));
          setFavoriteIds(ids);
        } else {
          setFavoriteIds(new Set());
        }
      } catch (error) {
        console.error("fetchFavorites error:", error);
        setFavoriteIds(new Set());
      }
    };

    fetchFavorites();
  }, [user, authLoading]);

  const totalPages = useMemo(() => {
    return Math.ceil((products?.length || 0) / itemsPerPage);
  }, [products]);

  const paginatedProducts = useMemo(() => {
    return products.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [products, currentPage]);

  const handleSortChange = (nextSort) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (subcategoryId) {
      params.set("subcategory", subcategoryId);
    } else {
      params.delete("subcategory");
    }

    if (!nextSort || nextSort === "latest") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    startSortTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  const ensureLoggedIn = () => {
    if (authLoading) return false;

    if (!user) {
      router.push("/login");
      return false;
    }

    return true;
  };

  const toggleFavorite = async (productId) => {
    try {
      if (!ensureLoggedIn()) return;

      setFavoriteLoadingId(productId);

      const isFav = favoriteIds.has(productId);

      if (!isFav) {
        const json = await authFetch("/api/v1/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: productId }),
        });

        if (!json?.success) {
          alert(json?.error?.message || "Gagal menambahkan favorite");
          return;
        }

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      } else {
        const json = await authFetch(`/api/v1/favorites/${productId}`, {
          method: "DELETE",
        });

        if (!json?.success) {
          alert(json?.error?.message || "Gagal menghapus favorite");
          return;
        }

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } catch (error) {
      console.error("toggleFavorite error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  const addToCart = async (productId) => {
    try {
      if (!ensureLoggedIn()) return;

      setAddingId(productId);

      const json = await authFetch("/api/v1/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          qty: 1,
        }),
      });

      if (!json?.success) {
        alert(json?.error?.message || "Gagal menambahkan ke keranjang");
        return;
      }

      notifyCustomerCartChanged();
    } catch (error) {
      console.error("Add to cart failed:", error);
      alert("Terjadi kesalahan");
    } finally {
      setAddingId(null);
    }
  };

  const handleBuyNow = async (productId) => {
    try {
      if (!ensureLoggedIn()) return;

      setCheckoutLoadingId(productId);

      const addJson = await authFetch("/api/v1/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          qty: 1,
        }),
      });

      if (!addJson?.success) {
        alert(addJson?.error?.message || "Gagal menambahkan produk");
        return;
      }

      const checkoutJson = await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucher_code: null,
        }),
      });

      if (!checkoutJson?.success) {
        alert(checkoutJson?.error?.message || "Checkout gagal");
        return;
      }

      notifyCustomerCartChanged();
      router.push("/customer/category/product/detail/lengkapipembelian");
    } catch (error) {
      console.error("Buy now error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case "member":
        return "bg-green-600 text-white";
      case "reseller":
        return "bg-blue-600 text-white";
      case "vip":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      default:
        return "bg-purple-700 text-white";
    }
  };

  const headerImage =
    header?.subcategory?.image_url ||
    products?.[0]?.subcategory?.image_url ||
    "/placeholder.png";

  return (
    <section className="mx-auto max-w-6xl px-8 py-10 text-white">
      <div className="mb-10 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-purple-700">
          <Image
            src={headerImage}
            width={600}
            height={360}
            alt="Header"
            className="h-[260px] w-full object-cover"
            priority
          />
        </div>

        <div>
          <span className="mb-2 inline-block text-xs font-medium uppercase tracking-wide text-purple-400">
            {header?.category?.name || "Kategori"}
          </span>

          <h1 className="mb-3 text-2xl font-bold text-purple-300">
            {header?.subcategory?.name || "Produk"}
          </h1>

          <p className="text-sm leading-relaxed text-gray-300">
            {header?.subcategory?.description ||
              "Deskripsi subkategori akan tampil di sini"}
          </p>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <select
          disabled={catalogDisabled || isSortPending}
          value={initialSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-lg border border-purple-700 bg-black px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {catalogDisabled ? (
        <FeatureMaintenanceCard
          title="Katalog sedang maintenance"
          message={maintenanceMessage}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            paginatedProducts.map((product) => {
              const pricing = Array.isArray(product.tier_pricing)
                ? product.tier_pricing[0]
                : product.tier_pricing;

              const originalPrice =
                pricing?.[userTier] ??
                pricing?.member ??
                pricing?.guest ??
                0;

              const discountPrice = product.discount_price;
              const discountPercent = product.discount_percent;

              const calculatedDiscountPrice = discountPercent
                ? originalPrice - (originalPrice * discountPercent) / 100
                : null;

              const finalPrice =
                discountPrice ?? calculatedDiscountPrice ?? originalPrice;

              const isDiscounted = finalPrice < originalPrice;
              const isAdding = addingId === product.id;
              const isOutOfStock = (product.available_stock ?? 0) <= 0;
              const isFav = favoriteIds.has(product.id);
              const favLoading = favoriteLoadingId === product.id;

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-purple-700 bg-black"
                >
                  <div className="relative h-[160px] bg-white">
                    <Image
                      src={product?.subcategory?.image_url || "/placeholder.png"}
                      width={300}
                      height={200}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />

                    <button
                      onClick={() => toggleFavorite(product.id)}
                      disabled={favLoading}
                      className={cn(
                        "absolute right-3 top-3 flex h-10 w-10 select-none items-center justify-center rounded-full border transition",
                        isFav
                          ? "border-pink-400 bg-pink-500/20 text-pink-400"
                          : "border-white/20 bg-black/40 text-white",
                        "disabled:opacity-60"
                      )}
                      title={isFav ? "Hapus dari Favorite" : "Tambah ke Favorite"}
                    >
                      {favLoading ? "⏳" : isFav ? "♥" : "♡"}
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 font-semibold">{product.name}</h3>

                    <p className="mb-1 text-xs text-gray-400">
                      Stok Tersedia {product.available_stock ?? 0}
                    </p>

                    {product.track_stock &&
                      product.available_stock <= product.stock_min_alert && (
                        <p className="text-xs text-red-400">⚠ Stok hampir habis</p>
                      )}

                    <div className="mb-2 flex items-center text-sm text-yellow-400">
                      <span className="mr-1">
                        {"★".repeat(Math.round(product.rating || 0))}
                        {"☆".repeat(5 - Math.round(product.rating || 0))}
                      </span>

                      <span className="text-xs text-gray-400">
                        {product.rating?.toFixed(1) || "0.0"} (
                        {product.rating_count || 0})
                      </span>
                    </div>

                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {isDiscounted && (
                          <span className="text-xs text-gray-400 line-through">
                            Rp {originalPrice.toLocaleString("id-ID")}
                          </span>
                        )}

                        <span
                          className={`font-bold ${
                            isDiscounted ? "text-green-400" : "text-white"
                          }`}
                        >
                          Rp {finalPrice.toLocaleString("id-ID")}
                        </span>

                        {userTier !== "guest" && (
                          <span
                            className={`w-fit rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${getTierBadgeClass(
                              userTier
                            )}`}
                          >
                            {userTier}
                          </span>
                        )}
                      </div>

                      <span className="rounded bg-purple-800 px-2 py-1 text-xs text-purple-200">
                        {product.type || "Otomatis"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBuyNow(product.id)}
                        disabled={checkoutLoadingId === product.id || isOutOfStock}
                        className={cn(
                          "relative flex-1 rounded-lg py-2 text-sm font-semibold transition",
                          isOutOfStock
                            ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                            : "bg-purple-600 text-white hover:bg-purple-700",
                          "disabled:opacity-70"
                        )}
                      >
                        {checkoutLoadingId === product.id
                          ? "Memproses..."
                          : isOutOfStock
                          ? "🔒 Stok Habis"
                          : "Beli Sekarang"}
                      </button>

                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={isAdding || isOutOfStock}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg border border-purple-600 transition hover:bg-purple-600/20 disabled:opacity-50",
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
        </div>
      )}

      {totalPages > 1 && !catalogDisabled && (
        <div className="mt-10 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-purple-700 px-4 py-2 text-purple-300 transition hover:bg-purple-700/30 disabled:opacity-40"
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
                  "rounded-lg px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-700/40"
                    : "border border-purple-700 bg-black text-purple-300 hover:bg-purple-700/30"
                )}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-purple-700 px-4 py-2 text-purple-300 transition hover:bg-purple-700/30 disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}

function FeatureMaintenanceCard({ title, message }) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
      <h3 className="mb-2 text-xl font-semibold text-amber-300">{title}</h3>
      <p className="text-amber-100/90">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-20 text-center text-zinc-500">
      Tidak ada produk
    </div>
  );
}