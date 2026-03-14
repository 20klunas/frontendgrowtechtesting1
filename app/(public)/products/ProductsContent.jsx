"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subcategoryId = searchParams.get("subcategory");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("terbaru");

  /* ================= FETCH PRODUCTS ================= */

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
        console.error("Non JSON response:", text);
        throw new Error("Invalid API response");
      }

      const json = await res.json();

      if (json.success) {
        setProducts(json?.data?.data || []);
      }

    } catch (err) {
      console.error("Fetch products error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER + SORT ================= */

  const filteredProducts = useMemo(() => {

    let data = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sort === "termurah") {
      data = [...data].sort(
        (a, b) => a.tier_pricing?.member - b.tier_pricing?.member
      );
    }

    if (sort === "terbaru") {
      data = [...data].sort((a, b) => b.id - a.id);
    }

    if (sort === "terlaris") {
      data = [...data].sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }

    return data;

  }, [products, search, sort]);

  /* ================= BUY ================= */

  const handleBuy = () => {
    router.push("/login");
  };

  return (
    <main className="min-h-screen px-4 sm:px-8 lg:px-12 py-8 text-white">

      {/* ================= TITLE ================= */}

      <motion.h1
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        {subcategoryId ? "Produk" : "Semua Produk"}
      </motion.h1>

      {/* ================= TOOLBAR ================= */}

      <div className="
        flex flex-col md:flex-row
        gap-3
        justify-between
        mb-6
        backdrop-blur-xl
        bg-white/5
        border border-white/10
        rounded-xl
        p-4
      ">

        <input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            bg-black/30
            border border-white/10
            rounded-lg
            px-3 py-2
            text-sm
            outline-none
            w-full md:w-64
            focus:border-purple-500
          "
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="
            bg-black/30
            border border-white/10
            rounded-lg
            px-3 py-2
            text-sm
            outline-none
            w-full md:w-40
          "
        >
          <option value="latest">Terbaru</option>
          <option value="bestseller">Terlaris</option>
          <option value="favorite">Favorit</option>
          <option value="popular">Popular</option>
          <option value="rating">Top Rated</option>
        </select>

      </div>

      {/* ================= GRID ================= */}

      <div className="
        grid
        grid-cols-2
        sm:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        gap-5
      ">

        {loading ? (
          [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
        ) : filteredProducts.length === 0 ? (
          <EmptyState />
        ) : (
          filteredProducts.map((product, i) => {

            const pricing =
              Array.isArray(product.tier_pricing)
                ? product.tier_pricing[0]
                : product.tier_pricing;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{
                  scale: 1.05,
                  rotateX: 4,
                  rotateY: -4
                }}
                className="
                  group
                  relative
                  rounded-2xl
                  p-5
                  bg-gradient-to-b
                  from-zinc-900
                  to-black
                  border border-zinc-800
                  shadow-lg
                  hover:shadow-purple-500/30
                  transition
                  duration-300
                "
              >

                {/* Glow effect */}

                <div className="
                  absolute inset-0
                  opacity-0
                  group-hover:opacity-100
                  transition
                  bg-purple-500/10
                  blur-2xl
                " />

                <div className="relative flex flex-col h-full">

                  {/* PRODUCT TITLE */}

                  <h3 className="text-lg font-semibold mb-1">
                    {product.name}
                  </h3>

                  {/* DESC */}

                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {product.description}
                  </p>

                  {/* DURASI */}

                  {product.duration_days && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Durasi: {product.duration_days} hari
                    </p>
                  )}

                  {/* PRICE */}

                  {pricing?.member && (
                    <div className="mt-4">
                      <p className="text-xs text-zinc-400">
                        Harga mulai
                      </p>

                      <p className="text-xl font-bold text-purple-400">
                        Rp {pricing.member.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* BUTTON */}

                  <button
                    onClick={() => handleBuy(product)}
                    className="
                      mt-auto
                      w-full
                      rounded-lg
                      bg-gradient-to-r
                      from-purple-600
                      to-purple-500
                      hover:from-purple-500
                      hover:to-purple-400
                      transition
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      shadow-md
                      hover:shadow-purple-500/40
                    "
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

/* ================= SKELETON ================= */

function SkeletonCard() {
  return (
    <div className="
      rounded-2xl
      p-5
      bg-gradient-to-b
      from-zinc-900
      to-black
      border border-zinc-800
      animate-pulse
    ">

      <div className="h-5 w-3/4 bg-zinc-800 rounded mb-3" />

      <div className="h-4 w-full bg-zinc-800 rounded mb-2" />

      <div className="h-4 w-5/6 bg-zinc-800 rounded mb-3" />

      <div className="h-6 w-1/2 bg-zinc-800 rounded mb-5" />

      <div className="h-10 w-full bg-zinc-800 rounded-lg" />

    </div>
  );
}

/* ================= EMPTY STATE ================= */

function EmptyState() {
  return (
    <div className="col-span-full text-center py-20">

      <div className="
        mx-auto
        w-24
        h-24
        rounded-full
        bg-white/5
        flex
        items-center
        justify-center
        mb-4
      ">
        📦
      </div>

      <p className="text-lg text-zinc-400">
        Tidak ada produk ditemukan
      </p>

      <p className="text-sm text-zinc-500">
        Coba ubah filter atau kata kunci pencarian
      </p>

    </div>
  );
}