"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/customer/SubCategoryCard";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { authFetch } from "../../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../../lib/maintenanceHandler";
import useCatalogAccess from "../../hooks/useCatalogAccess";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CategoryPage() {

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  const [catalogMaintenance, setCatalogMaintenance] = useState("");

  const { catalogDisabled, catalogMessage } = useCatalogAccess();


  /* ================= FILTER ================= */

  const safeSubcategories = Array.isArray(subcategories) ? subcategories : [];

  const filteredSubcategories = safeSubcategories
    .filter((sub) =>
      sub?.name?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((sub) =>
      selectedCategory ? sub?.category_id === selectedCategory : true
    );



  /* ================= PAGINATION ================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);

  const paginatedSubs = filteredSubcategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  /* ================= FETCH ================= */

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {

      const json = await authFetch("/api/v1/catalog/categories");

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
      setCatalogMaintenance("");

      const url = categoryId
        ? `${API}/api/v1/catalog/categories/${categoryId}/subcategories`
        : `${API}/api/v1/catalog/subcategories`;

      const json = await authFetch(url.replace(API, ""));

      if (json?.success && Array.isArray(json.data)) {
        setSubcategories(json.data);
      } else {
        console.warn("Invalid subcategory response:", json);
        setSubcategories([]);
      }


    } catch (err) {

      if (isFeatureMaintenanceError(err, "catalog_access")) {

        setCatalogMaintenance(
          getMaintenanceMessage(err, "Katalog sedang maintenance.")
        );

        setSubcategories([]);
        return;
      }

      if (!isMaintenanceError(err)) {
        console.error("Failed fetch subcategories:", err);
      }

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ================= TITLE ================= */}

      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Produk
        </h1>

      </div>


      <div className="flex flex-col lg:flex-row gap-8">


        {/* ================= SIDEBAR ================= */}

        <aside
          className="
          lg:w-64
          bg-gradient-to-b
          from-[#0b0120]
          to-[#060012]
          border border-purple-800/40
          rounded-2xl
          p-4
          flex
          lg:flex-col
          gap-2
          overflow-x-auto
          lg:overflow-visible
          backdrop-blur
        "
        >

          <h4 className="hidden lg:block text-white/70 mb-3 text-sm tracking-wide">
            Kategori
          </h4>


          <button
            disabled={catalogDisabled}
            onClick={() => handleCategoryClick(null)}
            className={`

            whitespace-nowrap
            px-4 py-2
            rounded-lg
            text-sm
            transition
            border

            ${
              !selectedCategory
                ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-700/30"
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

              whitespace-nowrap
              px-4 py-2
              rounded-lg
              text-sm
              transition
              border

              ${
                selectedCategory === cat.id
                  ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-700/30"
                  : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
              }

            `}
            >
              {cat.name}
            </button>

          ))}

        </aside>


        {/* ================= CONTENT ================= */}

        <section className="flex-1 space-y-6">


          {/* ================= TOOLBAR ================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

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
                  focus:outline-none
                  focus:ring-2
                  focus:ring-purple-600
                "
              />

            </div>

          </div>



          {/* ================= GRID ================= */}

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
              transition={{ duration: 0.3 }}
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-6
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

          )}



          {/* ================= PAGINATION ================= */}

          {totalPages > 1 && (

            <div className="flex justify-center mt-8 gap-2 flex-wrap">

              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="
                px-4 py-2
                rounded-lg
                border border-purple-700
                text-purple-300
                hover:bg-purple-700/30
                disabled:opacity-40
                transition
              "
              >
                ←
              </button>


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

                    px-4 py-2
                    rounded-lg
                    text-sm
                    font-semibold
                    transition

                    ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-700/40"
                        : "bg-black text-purple-300 border border-purple-700 hover:bg-purple-700/30"
                    }

                  `}
                  >
                    {page}
                  </motion.button>

                );
              })}


              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="
                px-4 py-2
                rounded-lg
                border border-purple-700
                text-purple-300
                hover:bg-purple-700/30
                disabled:opacity-40
                transition
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
