"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "../../components/ProductCard";
import { motion } from "framer-motion";
import { publicFetch } from "../../lib/publicFetch"
const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductPage() {

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sort, setSort] = useState("terbaru");

  const [loading, setLoading] = useState(true);

  /* =========================
     DEBOUNCE SEARCH
  ========================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* =========================
     FETCH DATA
  ========================= */

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await publicFetch(`/api/v1/categories`);

      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Failed fetch categories:", err);
    }
  };

  const fetchSubcategories = async (categoryId = null) => {
    try {

      setLoading(true);

      const url = categoryId
        ? `${API}/api/v1/categories/${categoryId}/subcategories`
        : `${API}/api/v1/subcategories`;

      const res = await publicFetch(url.replace(API,""));

      if (json.success) {

        const data = Array.isArray(json.data)
          ? json.data
          : json.data?.data || [];

        setSubcategories(data);
      }

      setLoading(false);

    } catch (err) {
      console.error("Failed fetch subcategories:", err);
      setLoading(false);
    }
  };

  /* =========================
     CATEGORY CLICK
  ========================= */

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchSubcategories(categoryId);
  };

  /* =========================
     FILTER + SORT
  ========================= */

  const filteredSubcategories = useMemo(() => {

    let data = (Array.isArray(subcategories) ? subcategories : []).filter((sub) =>
      (sub.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    if (sort === "termurah") {
      data = [...data].sort((a, b) => a.price - b.price);
    }

    if (sort === "terlaris") {
      data = [...data].sort((a, b) => b.sold - a.sold);
    }

    if (sort === "terbaru") {
      data = [...data].sort((a, b) => b.id - a.id);
    }

    return data;

  }, [subcategories, debouncedSearch, sort]);

  return (
    <main className="min-h-screen text-white px-4 sm:px-6 lg:px-10 py-8">

      {/* ================= TITLE ================= */}

      <motion.h1
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Produk
      </motion.h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ================= SIDEBAR ================= */}

        <aside className="
          lg:w-64
          backdrop-blur-xl
          bg-white/5
          border border-white/10
          rounded-2xl
          p-4
        ">

          <h4 className="text-sm font-semibold mb-3 text-purple-400">
            Kategori
          </h4>

          <div className="
            flex lg:flex-col
            gap-2
            overflow-x-auto lg:overflow-visible
            whitespace-nowrap
          ">

            <CategoryButton
              active={!selectedCategory}
              onClick={() => handleCategoryClick(null)}
            >
              Semua
            </CategoryButton>

            {categories.map((cat) => (
              <CategoryButton
                key={cat.id}
                active={selectedCategory === cat.id}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
              </CategoryButton>
            ))}

          </div>
        </aside>

        {/* ================= CONTENT ================= */}

        <section className="flex-1">

          {/* ================= TOOLBAR ================= */}

          <div className="
            flex flex-col sm:flex-row
            gap-3
            sm:items-center
            sm:justify-between
            backdrop-blur-xl
            bg-white/5
            border border-white/10
            rounded-2xl
            p-4
            mb-5
          ">

            <span className="text-sm text-white/60">
              Menampilkan {filteredSubcategories.length} produk
            </span>

            <div className="flex flex-col sm:flex-row gap-2">

              {/* SEARCH */}

              <input
                type="text"
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
                  w-full sm:w-56
                  focus:border-purple-500
                "
              />

              {/* SORT */}

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
                  w-full sm:w-40
                  focus:border-purple-500
                "
              >
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Termurah</option>
                <option value="terlaris">Terlaris</option>
              </select>

            </div>
          </div>

          {/* ================= GRID ================= */}

          {loading ? (
            <SkeletonGrid />
          ) : (
            <motion.div
              layout
              className="
                grid
                grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                gap-4
              "
            >

              {filteredSubcategories.map((sub) => (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProductCard subcategory={sub} />
                </motion.div>
              ))}

              {filteredSubcategories.length === 0 && (
                <p className="text-white/40 col-span-full text-center py-10">
                  Produk tidak ditemukan
                </p>
              )}

            </motion.div>
          )}

        </section>

      </div>

    </main>
  );
}

/* =========================
   CATEGORY BUTTON
========================= */

function CategoryButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`
        px-3 py-2 rounded-lg text-sm transition
        ${
          active
            ? "bg-purple-600 text-white"
            : "bg-white/5 hover:bg-white/10 text-white/70"
        }
      `}
    >
      {children}
    </button>
  );
}

/* =========================
   SKELETON LOADING
========================= */

function SkeletonGrid() {
  return (
    <div className="
      grid
      grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
      gap-4
    ">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="
            h-48
            rounded-xl
            bg-white/5
            animate-pulse
          "
        />
      ))}
    </div>
  );
}