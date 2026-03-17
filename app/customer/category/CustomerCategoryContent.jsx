"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "../../components/customer/SubCategoryCard";

export default function CustomerCategoryContent({
  initialCategories = [],
  initialSubcategories = [],
  maintenanceMessage = "",
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;
  const catalogDisabled = Boolean(maintenanceMessage);
  const deferredSearch = useDeferredValue(search);

  const categories = Array.isArray(initialCategories) ? initialCategories : [];
  const subcategories = Array.isArray(initialSubcategories)
    ? initialSubcategories
    : [];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredSubcategories = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return subcategories
      .filter((sub) =>
        keyword ? sub?.name?.toLowerCase().includes(keyword) : true
      )
      .filter((sub) =>
        selectedCategory ? sub?.category_id === selectedCategory : true
      );
  }, [subcategories, deferredSearch, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, selectedCategory]);

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
            disabled={catalogDisabled}
            onClick={() => setSelectedCategory(null)}
            className={`
              whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition
              ${
                !selectedCategory
                  ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-700/30"
                  : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
              }
              ${catalogDisabled ? "cursor-not-allowed opacity-60" : ""}
            `}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              disabled={catalogDisabled}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition
                ${
                  selectedCategory === cat.id
                    ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-700/30"
                    : "border-purple-700 text-purple-300 hover:bg-purple-700/20"
                }
                ${catalogDisabled ? "cursor-not-allowed opacity-60" : ""}
              `}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        <section className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-white/70">
                {!mounted
                    ? "Menampilkan semua produk"
                    : selectedCategory
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
                disabled={catalogDisabled}
                className="
                  w-full rounded-xl border border-purple-700/50 bg-[#0a0120]
                  py-2 pl-10 pr-3 text-sm text-white
                  focus:outline-none focus:ring-2 focus:ring-purple-600
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              />
            </div>
          </div>

          {catalogDisabled ? (
            <FeatureMaintenanceCard
              title="Katalog sedang maintenance"
              message={maintenanceMessage}
            />
          ) : (
            <div
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
            </div>
          )}

          {totalPages > 1 && !catalogDisabled && (
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
                  <button
                    key={page}
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
                  </button>
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