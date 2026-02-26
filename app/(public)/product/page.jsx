"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase())
  );

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
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchSubcategories(categoryId);
  };

  return (
    <main className="product-wrapper text-white px-4 sm:px-6 lg:px-10 py-6">

      {/* ================= TITLE ================= */}
      <h1 className="product-title text-2xl sm:text-3xl font-bold mb-6">
        Produk
      </h1>

      <div className="product-layout flex flex-col lg:flex-row gap-6">

        {/* ================= SIDEBAR ================= */}
        <aside className="
          product-sidebar
          lg:w-64
          bg-black/40
          border border-purple-800/40
          rounded-xl
          p-4
        ">
          <h4 className="text-sm font-semibold mb-3 text-purple-400">
            Kategori
          </h4>

          {/* MOBILE → horizontal scroll */}
          <div className="
            flex lg:flex-col
            gap-2
            overflow-x-auto lg:overflow-visible
            whitespace-nowrap
          ">
            <button
              className={`
                category-btn
                ${!selectedCategory ? "active" : ""}
              `}
              onClick={() => handleCategoryClick(null)}
            >
              Semua
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`
                  category-btn
                  ${selectedCategory === cat.id ? "active" : ""}
                `}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </aside>

        {/* ================= CONTENT ================= */}
        <section className="product-content flex-1">

          {/* ================= TOOLBAR ================= */}
          <div className="
            product-toolbar
            flex flex-col sm:flex-row
            gap-3
            sm:items-center
            sm:justify-between
            bg-black/40
            border border-purple-800/40
            rounded-xl
            p-3 sm:p-4
            mb-4
          ">
            <span className="text-sm text-white/60">
              Menampilkan {filteredSubcategories.length} produk
            </span>

            <div className="
              flex flex-col sm:flex-row
              gap-2
              w-full sm:w-auto
            ">
              <input
                type="text"
                placeholder="Cari Produk"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  bg-purple-900/30
                  border border-purple-700
                  rounded-lg
                  px-3 py-2
                  text-sm
                  outline-none
                  w-full sm:w-52
                "
              />

              <select
                className="
                  bg-purple-900/30
                  border border-purple-700
                  rounded-lg
                  px-3 py-2
                  text-sm
                  outline-none
                  w-full sm:w-40
                "
              >
                <option>Terbaru</option>
                <option>Termurah</option>
                <option>Terlaris</option>
              </select>
            </div>
          </div>

          {/* ================= GRID ================= */}
          <div className="
            product-grid
            grid
            grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
            gap-3 sm:gap-4
          ">
            {filteredSubcategories.map((sub) => (
              <ProductCard key={sub.id} subcategory={sub} />
            ))}

            {filteredSubcategories.length === 0 && (
              <p className="text-white/50 col-span-full text-center py-10">
                Produk tidak ditemukan
              </p>
            )}
          </div>

        </section>
      </div>
    </main>
  );
}