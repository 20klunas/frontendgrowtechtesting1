"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import ProductCard from "../../components/customer/SubCategoryCard";
import { authFetch } from "../../lib/authFetch";
import useCatalogAccess from "../../hooks/useCatalogAccess";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../../lib/maintenanceHandler";

export const dynamic = "force-dynamic";

function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null;

  const num = Number(value);
  return Number.isNaN(num) ? value : num;
}

function normalizeCategoriesResponse(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.categories)) return json.data.categories;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

function normalizeSubcategoriesResponse(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.subcategories)) return json.data.subcategories;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

export default function CustomerCategoryContent({
  initialCategories = [],
  initialSubcategories = [],
  maintenanceMessage = "",
}) {
  const [categories, setCategories] = useState(
    Array.isArray(initialCategories) ? initialCategories : []
  );
  const [subcategories, setSubcategories] = useState(
    Array.isArray(initialSubcategories) ? initialSubcategories : []
  );

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loadingCategories, setLoadingCategories] = useState(
    !Array.isArray(initialCategories) || initialCategories.length === 0
  );
  const [loadingSubcategories, setLoadingSubcategories] = useState(
    !Array.isArray(initialSubcategories)
  );

  const [catalogMaintenance, setCatalogMaintenance] = useState(
    maintenanceMessage || ""
  );

  const deferredSearch = useDeferredValue(search);
  const itemsPerPage = 6;

  const { catalogDisabled, catalogMessage } = useCatalogAccess();

  const effectiveMaintenanceMessage =
    catalogMessage || catalogMaintenance || maintenanceMessage || "";

  const isCatalogUnavailable =
    Boolean(catalogDisabled) || Boolean(effectiveMaintenanceMessage);

  const selectedCategoryName = useMemo(() => {
    const active = categories.find(
      (cat) => normalizeId(cat?.id) === normalizeId(selectedCategory)
    );

    return active?.name || null;
  }, [categories, selectedCategory]);

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const json = await authFetch("/api/v1/catalog/categories");

        if (!active) return;

        if (json?.success) {
          const data = normalizeCategoriesResponse(json);
          setCategories(Array.isArray(data) ? data : []);
          return;
        }

        setCategories([]);
      } catch (err) {
        if (!active) return;
        console.error("Failed fetch categories:", err);
        setCategories([]);
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchSubcategories = async () => {
      try {
        setLoadingSubcategories(true);
        setCatalogMaintenance("");

        const categoryId = normalizeId(selectedCategory);

        const url =
          categoryId !== null
            ? `/api/v1/catalog/categories/${categoryId}/subcategories`
            : "/api/v1/catalog/subcategories";

        const json = await authFetch(url);

        if (!active) return;

        if (json?.success) {
          const subs = normalizeSubcategoriesResponse(json);
          setSubcategories(Array.isArray(subs) ? subs : []);
        } else {
          console.warn("Invalid subcategory response:", json);
          setSubcategories([]);
        }
      } catch (err) {
        if (!active) return;

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
        if (active) {
          setLoadingSubcategories(false);
        }
      }
    };

    fetchSubcategories();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, selectedCategory]);

  const filteredSubcategories = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return subcategories.filter((sub) => {
      const name = sub?.name?.toLowerCase?.() || "";
      return keyword ? name.includes(keyword) : true;
    });
  }, [subcategories, deferredSearch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubcategories.length / itemsPerPage)
  );

  const paginatedSubs = useMemo(() => {
    return filteredSubcategories.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredSubcategories, currentPage]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearch("");
    setCurrentPage(1);
  };

  const isLoading = loadingCategories || loadingSubcategories;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Produk
        </h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside
          className="
            flex gap-2 overflow-x-auto rounded-2xl border border-purple-800/40
            bg-gradient-to-b from-[#0b0120] to-[#060012] p-4 backdrop-blur
            lg:w-64 lg:flex-col lg:overflow-visible
          "
        >
          <h4 className="mb-3 hidden text-sm tracking-wide text-white/70 lg:block">
            Kategori
          </h4>

          <button
            disabled={isCatalogUnavailable}
            onClick={() => handleCategoryClick(null)}
            className={`
              whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition
              ${
                selectedCategory === null
                  ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-700/30"
                  : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
              }
              ${isCatalogUnavailable ? "cursor-not-allowed opacity-60" : ""}
            `}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => {
            const catId = normalizeId(cat?.id);
            const isActive = normalizeId(selectedCategory) === catId;

            return (
              <button
                key={cat.id}
                disabled={isCatalogUnavailable}
                onClick={() => handleCategoryClick(catId)}
                className={`
                  whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition
                  ${
                    isActive
                      ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-700/30"
                      : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
                  }
                  ${isCatalogUnavailable ? "cursor-not-allowed opacity-60" : ""}
                `}
              >
                {cat.name}
              </button>
            );
          })}
        </aside>

        <section className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-white/70">
              {selectedCategoryName
                ? `Menampilkan subcategory dari kategori ${selectedCategoryName}`
                : "Menampilkan semua subcategory"}
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
                disabled={isCatalogUnavailable}
                className="
                  w-full rounded-xl border border-purple-700/50 bg-[#0a0120]
                  py-2 pl-10 pr-3 text-sm text-white
                  focus:outline-none focus:ring-2 focus:ring-purple-600
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              />
            </div>
          </div>

          {isCatalogUnavailable ? (
            <FeatureMaintenanceCard
              title="Katalog sedang maintenance"
              message={effectiveMaintenanceMessage}
            />
          ) : isLoading ? (
            <div className="rounded-2xl border border-purple-800/30 bg-[#0a0120] p-6 text-center text-white/70">
              Memuat data katalog...
            </div>
          ) : (
            <motion.div
              key={`${selectedCategory ?? "all"}-${currentPage}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="
                grid grid-cols-1 gap-6
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {paginatedSubs.map((sub) => (
                <ProductCard key={sub.id} subcategory={sub} />
              ))}

              {filteredSubcategories.length === 0 && (
                <p className="text-white/60">Produk tidak ditemukan</p>
              )}
            </motion.div>
          )}

          {totalPages > 1 && !isCatalogUnavailable && !isLoading && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="
                  rounded-lg border border-purple-700 px-4 py-2
                  text-purple-300 transition hover:bg-purple-700/30
                  disabled:opacity-40
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      rounded-lg px-4 py-2 text-sm font-semibold transition
                      ${
                        isActive
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-700/40"
                          : "border border-purple-700 bg-black text-purple-300 hover:bg-purple-700/30"
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
                  rounded-lg border border-purple-700 px-4 py-2
                  text-purple-300 transition hover:bg-purple-700/30
                  disabled:opacity-40
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
      <h3 className="mb-2 text-xl font-semibold text-amber-300">{title}</h3>
      <p className="text-amber-100/90">{message}</p>
    </div>
  );
}