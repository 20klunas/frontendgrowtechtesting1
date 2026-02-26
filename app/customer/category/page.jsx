"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/customer/SubCategoryCard";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);

  const paginatedSubs = filteredSubcategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    } catch (err) {
      console.error("Failed fetch subcategories:", err);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchSubcategories(categoryId);
  };

  return (
    <main className="product-wrapper px-4 sm:px-6 lg:px-8">
      <h1 className="product-title text-xl sm:text-2xl lg:text-3xl">
        Produk
      </h1>

      <div className="product-layout flex flex-col lg:flex-row gap-6">

        {/* ================= SIDEBAR ================= */}
        <aside
          className="
            product-sidebar
            lg:w-64
            flex lg:flex-col
            gap-2
            overflow-x-auto lg:overflow-visible
            pb-2 lg:pb-0
          "
        >
          <h4 className="hidden lg:block text-white/70 mb-2">
            Kategori
          </h4>

          <button
            className={!selectedCategory ? "active whitespace-nowrap" : "whitespace-nowrap"}
            onClick={() => handleCategoryClick(null)}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              className={
                selectedCategory === cat.id
                  ? "active whitespace-nowrap"
                  : "whitespace-nowrap"
              }
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        {/* ================= CONTENT ================= */}
        <section className="product-content flex-1">

          {/* ================= TOOLBAR ================= */}
          <div
            className="
              product-toolbar
              text-white
              flex flex-col sm:flex-row
              gap-3
              sm:items-center
              sm:justify-between
              flex-wrap
            "
          >
            <span className="text-sm sm:text-base">
              {selectedCategory
                ? "Menampilkan produk kategori"
                : "Menampilkan semua produk"}
            </span>

            <input
              type="text"
              placeholder="Cari Produk"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full sm:w-56
                rounded-lg
                px-3 py-2
                text-sm
                text-black
              "
            />

            <select
              className="
                w-full sm:w-40
                rounded-lg
                px-3 py-2
                text-sm
                text-black
              "
            >
              <option>Terbaru</option>
              <option>Termurah</option>
              <option>Terlaris</option>
            </select>
          </div>

          {/* ================= GRID ================= */}
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="
              product-grid
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-4 sm:gap-6
            "
          >
            {paginatedSubs.map((sub) => (
              <ProductCard key={sub.id} subcategory={sub} />
            ))}

            {filteredSubcategories.length === 0 && (
              <p className="text-white/60">
                Produk tidak ditemukan
              </p>
            )}
          </motion.div>

          {/* ================= PAGINATION ================= */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 sm:mt-10 gap-2 flex-wrap">

              {/* PREV */}
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="
                  px-3 sm:px-4 py-2
                  rounded-lg border border-purple-700
                  text-purple-300
                  hover:bg-purple-700/30
                  disabled:opacity-40 transition
                "
              >
                ←
              </button>

              {/* PAGE NUMBERS */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;

                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      relative
                      px-3 sm:px-4 py-2
                      rounded-lg text-sm font-semibold transition
                      ${isActive
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-700/40"
                        : "bg-black text-purple-300 border border-purple-700 hover:bg-purple-700/30"}
                    `}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="pagination-glow"
                        className="absolute inset-0 rounded-lg bg-purple-500/20 blur-md"
                      />
                    )}
                    {page}
                  </motion.button>
                );
              })}

              {/* NEXT */}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="
                  px-3 sm:px-4 py-2
                  rounded-lg border border-purple-700
                  text-purple-300
                  hover:bg-purple-700/30
                  disabled:opacity-40 transition
                "
              >
                →
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}