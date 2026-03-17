"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "../../components/customer/SubCategoryCard";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { authFetch } from "../../lib/authFetch";
import useCatalogAccess from "../../hooks/useCatalogAccess";

export default function CategoryPage() {

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const { catalogDisabled, catalogMessage } = useCatalogAccess();

  const itemsPerPage = 6;

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {

      setLoading(true);

      const [catRes, subRes] = await Promise.all([
        authFetch("/api/v1/catalog/categories"),
        authFetch("/api/v1/catalog/subcategories"),
      ]);

      if (catRes?.success) {
        setCategories(catRes.data || []);
      }

      if (subRes?.success) {

        const subs = Array.isArray(subRes.data)
          ? subRes.data
          : subRes.data?.data || [];

        setSubcategories(subs);

      } else {
        setSubcategories([]);
      }

    } catch (err) {

      console.error("Catalog fetch error:", err);
      setSubcategories([]);

    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */

  const filteredSubcategories = useMemo(() => {

    let data = subcategories;

    if (selectedCategory) {
      data = data.filter((s) => s.category_id === selectedCategory);
    }

    if (search) {
      const keyword = search.toLowerCase();
      data = data.filter((s) =>
        s?.name?.toLowerCase().includes(keyword)
      );
    }

    return data;

  }, [subcategories, selectedCategory, search]);

  /* ================= PAGINATION ================= */

  const totalPages = useMemo(() => {

    return Math.ceil(filteredSubcategories.length / itemsPerPage);

  }, [filteredSubcategories]);

  const paginatedSubs = useMemo(() => {

    const start = (currentPage - 1) * itemsPerPage;

    return filteredSubcategories.slice(
      start,
      start + itemsPerPage
    );

  }, [filteredSubcategories, currentPage]);

  /* reset page */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  /* ================= HANDLER ================= */

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  /* ================= RENDER ================= */

  return (

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* TITLE */}

      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">

        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Produk
        </h1>

      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* SIDEBAR */}

        <aside
          className="
          lg:w-64
          bg-gradient-to-b
          from-[#0b0120]
          to-[#060012]
          border border-purple-800/40
          rounded-2xl
          p-4
          flex lg:flex-col gap-2
          overflow-x-auto lg:overflow-visible
        "
        >

          <h4 className="hidden lg:block text-white/70 mb-3 text-sm">
            Kategori
          </h4>

          <button
            onClick={() => handleCategoryClick(null)}
            className={`
              px-4 py-2 rounded-lg text-sm border transition
              ${
                !selectedCategory
                  ? "bg-purple-600 text-white border-purple-500"
                  : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
              }
            `}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => (

            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`
                px-4 py-2 rounded-lg text-sm border transition
                ${
                  selectedCategory === cat.id
                    ? "bg-purple-600 text-white border-purple-500"
                    : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
                }
              `}
            >
              {cat.name}
            </button>

          ))}

        </aside>

        {/* CONTENT */}

        <section className="flex-1 space-y-6">

          {/* SEARCH */}

          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

            <span className="text-white/70 text-sm">
              {selectedCategory
                ? "Menampilkan produk kategori"
                : "Menampilkan semua produk"}
            </span>

            <div className="relative w-full sm:w-72">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Cari Produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  bg-[#0a0120]
                  border border-purple-700/50
                  pl-10 pr-3 py-2
                  text-sm
                  text-white
                "
              />

            </div>

          </div>

          {/* GRID */}

          {catalogDisabled ? (

            <FeatureMaintenanceCard
              title="Katalog sedang maintenance"
              message={catalogMessage}
            />

          ) : (

            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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

          )}

          {/* PAGINATION */}

          {totalPages > 1 && (

            <div className="flex justify-center mt-8 gap-2 flex-wrap">

              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-purple-700 rounded-lg text-purple-300"
              >
                ←
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {

                const page = i + 1;

                return (

                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`

                      px-4 py-2 rounded-lg text-sm

                      ${
                        page === currentPage
                          ? "bg-purple-600 text-white"
                          : "border border-purple-700 text-purple-300"
                      }

                    `}
                  >
                    {page}
                  </button>

                );

              })}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-purple-700 rounded-lg text-purple-300"
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

function FeatureMaintenanceCard({ title, message }) {

  return (

    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">

      <h3 className="text-xl font-semibold text-amber-300 mb-2">
        {title}
      </h3>

      <p className="text-amber-100/90">
        {message}
      </p>

    </div>

  );
}