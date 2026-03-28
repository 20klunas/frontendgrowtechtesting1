"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import ProductCard from "../../components/customer/SubCategoryCard"
import { publicFetch } from "../../lib/publicFetch"
import useCatalogAccess from "../../hooks/useCatalogAccess"

function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null

  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

function normalizeCategoriesResponse(json) {
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.data?.categories)) return json.data.categories
  if (Array.isArray(json?.data?.data)) return json.data.data
  return []
}

function normalizeSubcategoriesResponse(json) {
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.data?.subcategories)) return json.data.subcategories
  if (Array.isArray(json?.data?.data)) return json.data.data
  return []
}

export default function CustomerCategoryContent({
  initialCategories = null,
  initialSubcategories = null,
  maintenanceMessage = "",
}) {
  const hasInitialCategories = Array.isArray(initialCategories)
  const hasInitialSubcategories = Array.isArray(initialSubcategories)

  const [categories, setCategories] = useState(
    hasInitialCategories ? initialCategories : []
  )
  const [subcategories, setSubcategories] = useState(
    hasInitialSubcategories ? initialSubcategories : []
  )

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [loadingCategories, setLoadingCategories] = useState(
    !hasInitialCategories
  )
  const [loadingSubcategories, setLoadingSubcategories] = useState(
    !hasInitialSubcategories
  )

  const [catalogMaintenance, setCatalogMaintenance] = useState(
    maintenanceMessage || ""
  )

  const deferredSearch = useDeferredValue(search)
  const itemsPerPage = 6

  const { catalogDisabled, catalogMessage } = useCatalogAccess()

  useEffect(() => {
    setCatalogMaintenance(maintenanceMessage || "")
  }, [maintenanceMessage])

  useEffect(() => {
    if (hasInitialCategories) {
      setCategories(initialCategories)
      setLoadingCategories(false)
      return
    }

    let active = true

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)

        const json = await publicFetch("/api/v1/catalog/categories", {
          cache: "force-cache",
        })

        if (!active) return

        const data = normalizeCategoriesResponse(json)
        setCategories(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!active) return
        console.error("Failed fetch categories:", err)
        setCategories([])
      } finally {
        if (active) setLoadingCategories(false)
      }
    }

    fetchCategories()

    return () => {
      active = false
    }
  }, [hasInitialCategories, initialCategories])

  useEffect(() => {
    let active = true

    const fetchSubcategories = async () => {
      try {
        setLoadingSubcategories(true)
        setCatalogMaintenance("")

        const categoryId = normalizeId(selectedCategory)
        const url =
          categoryId !== null
            ? `/api/v1/catalog/categories/${categoryId}/subcategories`
            : "/api/v1/catalog/subcategories"

        const json = await publicFetch(url, {
          cache: "force-cache",
        })

        if (!active) return

        const subs = normalizeSubcategoriesResponse(json)
        setSubcategories(Array.isArray(subs) ? subs : [])
      } catch (err) {
        if (!active) return
        console.error("Failed fetch subcategories:", err)
        setSubcategories([])
      } finally {
        if (active) setLoadingSubcategories(false)
      }
    }

    if (selectedCategory === null && hasInitialSubcategories) {
      setSubcategories(initialSubcategories)
      setLoadingSubcategories(false)
      return
    }

    fetchSubcategories()

    return () => {
      active = false
    }
  }, [selectedCategory, hasInitialSubcategories, initialSubcategories])

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearch, selectedCategory])

  const filteredSubcategories = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase()
    const source = Array.isArray(subcategories) ? subcategories : []

    return source.filter((sub) => {
      if (selectedCategory !== null) {
        if (normalizeId(sub?.category?.id) !== normalizeId(selectedCategory)) {
          return false
        }
      }

      const haystack = [sub?.name, sub?.provider, sub?.category?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return keyword ? haystack.includes(keyword) : true
    })
  }, [subcategories, deferredSearch, selectedCategory])

  const selectedCategoryName = useMemo(() => {
    const selected = (Array.isArray(categories) ? categories : []).find(
      (cat) => normalizeId(cat?.id) === normalizeId(selectedCategory)
    )
    return selected?.name || ""
  }, [categories, selectedCategory])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubcategories.length / itemsPerPage)
  )

  const paginatedSubs = useMemo(() => {
    return filteredSubcategories.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
  }, [filteredSubcategories, currentPage])

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
    setSearch("")
    setCurrentPage(1)
  }

  const isLoading = loadingCategories || loadingSubcategories
  const isCatalogUnavailable = catalogDisabled || Boolean(catalogMaintenance)
  const effectiveMaintenanceMessage =
    catalogMaintenance || catalogMessage || "Katalog sedang maintenance."

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

          {(Array.isArray(categories) ? categories : []).map((cat) => {
            const catId = normalizeId(cat?.id)
            const isActive = normalizeId(selectedCategory) === catId

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
            )
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
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
              {effectiveMaintenanceMessage}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <div
                  key={index}
                  className="h-[220px] animate-pulse rounded-2xl border border-purple-900/30 bg-[#090114]"
                />
              ))}
            </div>
          ) : paginatedSubs.length === 0 ? (
            <div className="rounded-2xl border border-purple-900/30 bg-[#090114] px-5 py-8 text-center text-sm text-white/60">
              Produk tidak ditemukan.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedSubs.map((sub, index) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <ProductCard subcategory={sub} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1
                    const isActive = pageNumber === currentPage

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          isActive
                            ? "border-purple-500 bg-purple-600 text-white"
                            : "border-purple-800 text-purple-300 hover:bg-purple-700/20"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
