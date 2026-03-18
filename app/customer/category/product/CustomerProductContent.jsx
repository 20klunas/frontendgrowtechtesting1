"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { cn } from "../../../lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "../../../../app/hooks/useAuth";
import { authFetch } from "../../../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../../../lib/maintenanceHandler";
import useCatalogAccess from "../../../hooks/useCatalogAccess";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 6;

function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null;

  const num = Number(value);
  return Number.isNaN(num) ? value : num;
}

function normalizeProductsResponse(json) {
  const paginator = json?.data ?? {};
  return {
    items: Array.isArray(paginator?.data) ? paginator.data : [],
    currentPage: Number(paginator?.current_page || 1),
    lastPage: Number(paginator?.last_page || 1),
    total: Number(paginator?.total || 0),
    perPage: Number(paginator?.per_page || ITEMS_PER_PAGE),
  };
}

function normalizeSubcategoriesResponse(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.subcategories)) return json.data.subcategories;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

export default function CustomerProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subcategoryId =
    searchParams.get("subcategory_id") || searchParams.get("subcategory");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subcategoryInfo, setSubcategoryInfo] = useState(null);
  const [subcategoryLoading, setSubcategoryLoading] = useState(true);

  const [addingId, setAddingId] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [sort, setSort] = useState("latest");

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: ITEMS_PER_PAGE,
  });

  const [catalogMaintenance, setCatalogMaintenance] = useState("");
  const { catalogDisabled, catalogMessage } = useCatalogAccess();

  const { user } = useAuth();
  const userTier = user?.tier?.toLowerCase() || "guest";

  const resolvedSubcategory = subcategoryInfo || products?.[0]?.subcategory || null;
  const resolvedCategory = resolvedSubcategory?.category || products?.[0]?.category || null;

  const headerImage =
    resolvedSubcategory?.image_url ||
    resolvedSubcategory?.image ||
    products?.[0]?.subcategory?.image_url ||
    "/placeholder.png";

  const headerCategoryName = resolvedCategory?.name || "Kategori";
  const headerSubcategoryName = resolvedSubcategory?.name || "Produk";
  const headerDescription =
    resolvedSubcategory?.description || "Deskripsi subkategori akan tampil di sini";

  const totalPages = Math.max(1, Number(pagination?.lastPage || 1));

  useEffect(() => {
    setCurrentPage(1);
  }, [subcategoryId, sort]);

  useEffect(() => {
    fetchProducts();
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId, sort, currentPage]);

  useEffect(() => {
    fetchSubcategoryInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setCatalogMaintenance("");

      const params = new URLSearchParams();
      params.set("sort", sort);
      params.set("per_page", String(ITEMS_PER_PAGE));
      params.set("page", String(currentPage));

      if (subcategoryId) {
        params.set("subcategory_id", String(subcategoryId));
      }

      const json = await authFetch(`/api/v1/products?${params.toString()}`);

      if (json?.success) {
        const parsed = normalizeProductsResponse(json);
        setProducts(parsed.items);
        setPagination({
          currentPage: parsed.currentPage,
          lastPage: parsed.lastPage,
          total: parsed.total,
          perPage: parsed.perPage,
        });
      } else {
        setProducts([]);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: ITEMS_PER_PAGE,
        });
      }
    } catch (err) {
      if (isFeatureMaintenanceError(err, "catalog_access")) {
        setCatalogMaintenance(
          getMaintenanceMessage(err, "Katalog sedang maintenance.")
        );
        setProducts([]);
        return;
      }

      if (!isMaintenanceError(err)) {
        console.error("Failed fetch products:", err);
      }

      setProducts([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: ITEMS_PER_PAGE,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategoryInfo = async () => {
    try {
      if (!subcategoryId) {
        setSubcategoryInfo(null);
        setSubcategoryLoading(false);
        return;
      }

      setSubcategoryLoading(true);

      const json = await authFetch("/api/v1/subcategories");

      if (!json?.success) {
        setSubcategoryInfo(null);
        return;
      }

      const list = normalizeSubcategoriesResponse(json);
      const found = list.find(
        (item) => String(normalizeId(item?.id)) === String(normalizeId(subcategoryId))
      );

      setSubcategoryInfo(found || null);
    } catch (err) {
      if (!isMaintenanceError(err)) {
        console.error("Failed fetch subcategory info:", err);
      }
      setSubcategoryInfo(null);
    } finally {
      setSubcategoryLoading(false);
    }
  };

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
      if (json?.success) {
        const favoritesArray = Array.isArray(json?.data?.data)
          ? json.data.data
          : [];

        const ids = new Set(favoritesArray.map((f) => f.product_id));
        setFavoriteIds(ids);
      }
    } catch (e) {
      console.error("fetchFavorites error:", e);
    }
  };

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

  const handleBuyNow = async (productId) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setCheckoutLoadingId(productId);

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

      router.push("/customer/category/product/detail/lengkapipembelian");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Buy now error:", err);
      alert("Terjadi kesalahan");
    } finally {
      setCheckoutLoadingId(null);
    }
  };

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

  const showMaintenance = catalogDisabled || Boolean(catalogMaintenance || catalogMessage);

  return (
    <section className="mx-auto max-w-6xl px-8 py-10 text-white">
      <div className="mb-10 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-purple-700">
          <Image
            src={headerImage}
            width={600}
            height={360}
            alt={headerSubcategoryName}
            className="h-[260px] w-full object-cover"
            priority
          />
        </div>

        <div>
          <span className="mb-2 inline-block text-xs font-medium uppercase tracking-wide text-purple-400">
            {headerCategoryName}
          </span>

          <h1 className="mb-3 text-2xl font-bold text-purple-300">
            {subcategoryId ? headerSubcategoryName : "Semua Produk"}
          </h1>

          <p className="text-sm leading-relaxed text-gray-300">
            {subcategoryId
              ? headerDescription
              : "Menampilkan semua produk yang aktif dan telah dipublikasikan."}
          </p>

          {!loading && !subcategoryLoading && (
            <p className="mt-3 text-xs text-gray-400">
              Total produk: {pagination.total || 0}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <select
          disabled={showMaintenance}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-purple-700 bg-black px-3 py-2 text-white"
        >
          <option value="latest">Terbaru</option>
          <option value="bestseller">Terlaris</option>
          <option value="favorite">Favorit</option>
          <option value="popular">Popular</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {showMaintenance ? (
        <FeatureMaintenanceCard
          title="Katalog sedang maintenance"
          message={catalogMessage || catalogMaintenance}
        />
      ) : (
        <motion.div
          key={`${subcategoryId || "all"}-${sort}-${currentPage}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
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
            products.map((product) => {
              const pricing = Array.isArray(product.tier_pricing)
                ? product.tier_pricing[0]
                : product.tier_pricing;

              const originalPrice =
                pricing?.[userTier] ?? pricing?.member ?? pricing?.guest ?? 0;

              const isAdding = addingId === product.id;
              const isOutOfStock = (product.available_stock ?? 0) <= 0;

              const isFav = favoriteIds.has(product.id);
              const favLoading = favoriteLoadingId === product.id;

              const discountPrice = product.discount_price;
              const discountPercent = product.discount_percent;

              const calculatedDiscountPrice = discountPercent
                ? originalPrice - (originalPrice * discountPercent) / 100
                : null;

              const finalPrice =
                discountPrice ?? calculatedDiscountPrice ?? originalPrice;

              const isDiscounted = finalPrice < originalPrice;

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
                            Rp {Number(originalPrice).toLocaleString("id-ID")}
                          </span>
                        )}

                        <span
                          className={`font-bold ${
                            isDiscounted ? "text-green-400" : "text-white"
                          }`}
                        >
                          Rp {Number(finalPrice).toLocaleString("id-ID")}
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
        </motion.div>
      )}

      {totalPages > 1 && !showMaintenance && !loading && (
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

function SkeletonVariant() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-purple-700 bg-black">
      <div className="h-[160px] bg-zinc-800" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-800" />
        <div className="h-10 rounded bg-zinc-800" />
      </div>
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