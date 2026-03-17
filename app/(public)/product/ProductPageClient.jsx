"use client";

import { useState, useMemo } from "react";
import ProductCard from "../../components/ProductCard";
import { motion } from "framer-motion";
import { filterProducts } from "../../utils/productFilter";
import { publicFetch } from "../../lib/publicFetch";

export default function ProductPageClient({
  categories,
  initialSubcategories
}) {

  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("terbaru");
  const [loading, setLoading] = useState(false);

  const fetchSubcategories = async (categoryId = null) => {

    setLoading(true);

    try {

      const url = categoryId
        ? `/api/v1/categories/${categoryId}/subcategories`
        : `/api/v1/subcategories`;

      const json = await publicFetch(url);

      if (json.success) {
        const data = Array.isArray(json.data)
          ? json.data
          : json.data?.data || [];

        setSubcategories(data);
      }

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchSubcategories(categoryId);
  };

  const filteredSubcategories = useMemo(() => {
    return filterProducts(subcategories, search, sort);
  }, [subcategories, search, sort]);

  return (
    <main className="min-h-screen text-white px-4 sm:px-6 lg:px-10 py-8">

      <h1 className="text-3xl font-bold mb-8">Produk</h1>

      <div className="flex flex-col lg:flex-row gap-6">

        <aside className="lg:w-64 bg-white/5 border border-white/10 rounded-2xl p-4">

          <h4 className="text-sm font-semibold mb-3 text-purple-400">
            Kategori
          </h4>

          <div className="flex lg:flex-col gap-2 overflow-x-auto">

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

        <section className="flex-1">

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mb-5">

            <span className="text-sm text-white/60">
              Menampilkan {filteredSubcategories.length} produk
            </span>

            <div className="flex gap-2">

              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlaris">Terlaris</option>
                <option value="termurah">Termurah</option>
              </select>

            </div>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >

              {filteredSubcategories.map((sub) => (
                <motion.div key={sub.id} layout>
                  <ProductCard subcategory={sub} />
                </motion.div>
              ))}

            </motion.div>
          )}

        </section>

      </div>

    </main>
  );
}

function CategoryButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-lg text-sm ${
        active
          ? "bg-purple-600 text-white"
          : "bg-white/5 hover:bg-white/10 text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}