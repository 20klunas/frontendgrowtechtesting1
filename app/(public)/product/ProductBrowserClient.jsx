"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { motion } from "framer-motion"
import ProductCard from "../../components/ProductCard"

function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null

  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

export default function ProductBrowserClient({
  initialCategories = [],
  initialSubcategories = [],
}) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("latest")

  const deferredSearch = useDeferredValue(search)

  const filteredSubcategories = initialSubcategories

  // const filteredSubcategories = useMemo(() => {
  //   let data = Array.isArray(initialSubcategories) ? [...initialSubcategories] : []

  //   if (selectedCategory !== null) {
  //     data = data.filter(
  //       (sub) => normalizeId(sub?.category?.id) === normalizeId(selectedCategory)
  //     )
  //   }

  //   const keyword = deferredSearch.trim().toLowerCase()
  //   if (keyword) {
  //     data = data.filter((sub) => {
  //       const haystack = [sub?.name, sub?.provider, sub?.category?.name]
  //         .filter(Boolean)
  //         .join(" ")
  //         .toLowerCase()

  //       return haystack.includes(keyword)
  //     })
  //   }

  //   if (sort === "latest") {
  //     data.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
  //   } else if (sort === "name_asc") {
  //     data.sort((a, b) =>
  //       String(a?.name || "").localeCompare(String(b?.name || ""))
  //     )
  //   } else if (sort === "name_desc") {
  //     data.sort((a, b) =>
  //       String(b?.name || "").localeCompare(String(a?.name || ""))
  //     )
  //   }

  //   return data
  // }, [initialSubcategories, selectedCategory, deferredSearch, sort])

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-10">
      <motion.h1
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-bold"
      >
        Produk
      </motion.h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside
          className="
            rounded-2xl border border-white/10
            bg-white/5 p-4 backdrop-blur-xl
            lg:w-64
          "
        >
          <h4 className="mb-3 text-sm font-semibold text-purple-400">
            Kategori
          </h4>

          <div
            className="
              flex gap-2 overflow-x-auto whitespace-nowrap
              lg:flex-col lg:overflow-visible
            "
          >
            <CategoryButton
              active={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            >
              Semua
            </CategoryButton>

            {(Array.isArray(initialCategories) ? initialCategories : []).map((cat) => (
              <CategoryButton
                key={cat.id}
                active={normalizeId(selectedCategory) === normalizeId(cat.id)}
                onClick={() => setSelectedCategory(normalizeId(cat.id))}
              >
                {cat.name}
              </CategoryButton>
            ))}
          </div>
        </aside>

        <section className="flex-1">
          <div
            className="
              mb-5 flex flex-col gap-3 rounded-2xl
              border border-white/10 bg-white/5 p-4
              backdrop-blur-xl
              sm:flex-row sm:items-center sm:justify-between
            "
          >
            <span className="text-sm text-white/60">
              Menampilkan {filteredSubcategories.length} produk
            </span>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full rounded-lg border border-white/10
                  bg-black/30 px-3 py-2 text-sm outline-none
                  focus:border-purple-500 sm:w-56
                "
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="
                  w-full rounded-lg border border-white/10
                  bg-black/30 px-3 py-2 text-sm outline-none
                  focus:border-purple-500 sm:w-44
                "
              >
                <option value="latest">Terbaru</option>
                <option value="name_asc">Nama A-Z</option>
                <option value="name_desc">Nama Z-A</option>
              </select>
            </div>
          </div>

          <motion.div
            layout
            className="
              grid grid-cols-2 gap-4
              sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
            "
          >
            {filteredSubcategories.map((sub) => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard subcategory={sub} />
              </motion.div>
            ))}

            {filteredSubcategories.length === 0 && (
              <p className="col-span-full py-10 text-center text-white/40">
                Produk tidak ditemukan
              </p>
            )}
          </motion.div>
        </section>
      </div>
    </main>
  )
}

function CategoryButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-purple-600 text-white"
          : "border border-white/10 text-white/70 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  )
}
