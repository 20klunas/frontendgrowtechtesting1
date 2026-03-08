"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

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
      const res = await fetch(`${API}/api/v1/categories`);
      const json = await res.json();

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

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setSubcategories(json.data);
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

    let data = subcategories.filter((sub) =>
      sub.name.toLowerCase().includes(debouncedSearch.toLowerCase())
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
    <main className="min-h-screen text-white px-4 sm:px-6 lg:px-10 py-8
    bg-gradient-to-b from-[#020617] via-[#020617] to-black">

      {/* ================= TITLE ================= */}

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Produk
      </motion.h1>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ================= SIDEBAR ================= */}

        <aside className="
          lg:w-64
          backdrop-blur-xl
          bg-white/5
          border border-white/10
          rounded-2xl
          p-5
          shadow-xl
        ">

          <h4 className="text-sm font-semibold mb-4 text-purple-400">
            Kategori
          </h4>

          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">

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
            mb-6
            shadow-lg
          ">

            <span className="text-sm text-white/60">
              Menampilkan {filteredSubcategories.length} produk
            </span>

            <div className="flex flex-col sm:flex-row gap-2">

              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  bg-black/40
                  border border-white/10
                  rounded-lg
                  px-3 py-2
                  text-sm
                  outline-none
                  w-full sm:w-56
                  focus:border-purple-500
                "
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="
                  bg-black/40
                  border border-white/10
                  rounded-lg
                  px-3 py-2
                  text-sm
                  outline-none
                  w-full sm:w-40
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
                gap-6
              "
            >

              {filteredSubcategories.map((sub) => (

                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProductCardPremium subcategory={sub} />
                </motion.div>

              ))}

            </motion.div>

          )}

        </section>

      </div>

    </main>
  );
}

/* =========================
   PRODUCT CARD PREMIUM
========================= */

function ProductCardPremium({ subcategory }) {

  return (

    <div className="
      group
      relative
      rounded-2xl
      overflow-hidden
      border border-white/10
      bg-gradient-to-b from-[#020617] to-black
      shadow-lg
      transition
      hover:shadow-purple-500/30
    ">

      {/* IMAGE */}

      <div className="
        aspect-square
        flex
        items-center
        justify-center
        p-6
        bg-black
      ">

        <img
          src={subcategory.icon}
          alt={subcategory.name}
          className="
            max-h-full
            max-w-full
            object-contain
            transition
            duration-500
            group-hover:scale-110
          "
        />

      </div>

      {/* CONTENT */}

      <div className="p-4">

        <h3 className="font-semibold text-lg">
          {subcategory.name}
        </h3>

        <p className="text-xs text-white/50 mt-1">
          SELF-AUTO
        </p>

        <button
          className="
            mt-4
            w-full
            rounded-lg
            bg-gradient-to-r
            from-purple-600
            to-purple-500
            hover:from-purple-500
            hover:to-purple-400
            py-2.5
            text-sm
            font-semibold
            transition
            shadow-md
            hover:shadow-purple-500/40
          "
        >
          Lihat Produk
        </button>

      </div>

    </div>

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
        px-4 py-2 rounded-lg text-sm transition
        ${
          active
            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg"
            : "bg-white/5 hover:bg-white/10 text-white/70"
        }
      `}
    >
      {children}
    </button>
  );
}

/* =========================
   SKELETON
========================= */

function SkeletonGrid() {

  return (

    <div className="
      grid
      grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
      gap-6
    ">

      {[...Array(10)].map((_, i) => (

        <div
          key={i}
          className="
            aspect-square
            rounded-xl
            bg-white/5
            animate-pulse
          "
        />

      ))}

    </div>

  );

}