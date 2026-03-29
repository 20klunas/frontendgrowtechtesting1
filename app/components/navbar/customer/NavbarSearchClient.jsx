"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../../../lib/maintenanceHandler";
import { useAppTransition } from "../../../hooks/useAppTransition";
import { fetcher } from "../../../lib/fetcher";

const SUBCATEGORY_CACHE_TTL = 5 * 60 * 1000;
const SUBCATEGORY_STORAGE_KEY = "navbar-search-subcategories-v1";

let subcategoryCache = null;
let subcategoryCacheExpiry = 0;
let subcategoryPromise = null;

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readSubcategoryCache() {
  if (subcategoryCache && subcategoryCacheExpiry > Date.now()) {
    return subcategoryCache;
  }

  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SUBCATEGORY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(SUBCATEGORY_STORAGE_KEY);
      return null;
    }

    subcategoryCache = Array.isArray(parsed.data) ? parsed.data : [];
    subcategoryCacheExpiry = parsed.expiresAt;

    return subcategoryCache;
  } catch {
    return null;
  }
}

function writeSubcategoryCache(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  subcategoryCache = safeRows;
  subcategoryCacheExpiry = Date.now() + SUBCATEGORY_CACHE_TTL;

  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      SUBCATEGORY_STORAGE_KEY,
      JSON.stringify({
        data: safeRows,
        expiresAt: subcategoryCacheExpiry,
      })
    );
  } catch {}
}

async function loadSubcategories() {
  const cached = readSubcategoryCache();
  if (cached) {
    return cached;
  }

  if (subcategoryPromise) {
    return subcategoryPromise;
  }

  subcategoryPromise = fetcher("/api/v1/catalog/subcategories")
    .then((json) => {
      const rows = Array.isArray(json?.data) ? json.data : [];
      writeSubcategoryCache(rows);
      return rows;
    })
    .finally(() => {
      subcategoryPromise = null;
    });

  return subcategoryPromise;
}

export default function NavbarSearchClient() {
  const router = useRouter();
  const { beginTransition } = useAppTransition();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInteracted, setSearchInteracted] = useState(false);

  const [subcategories, setSubcategories] = useState(() => readSubcategoryCache() || []);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [subcategoriesLoaded, setSubcategoriesLoaded] = useState(() => Boolean(readSubcategoryCache()));
  const [searchMaintenance, setSearchMaintenance] = useState("");

  const searchRef = useRef(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const ensureSubcategoriesLoaded = async () => {
    if (subcategoriesLoaded && subcategories.length > 0) return;
    if (subcategoriesLoading) return;

    const cached = readSubcategoryCache();
    if (cached) {
      setSubcategories(cached);
      setSubcategoriesLoaded(true);
      return;
    }

    try {
      setSubcategoriesLoading(true);
      setSearchMaintenance("");

      const rows = await loadSubcategories();
      setSubcategories(rows);
      setSubcategoriesLoaded(true);
    } catch (err) {
      if (isFeatureMaintenanceError(err, "catalog_access")) {
        setSearchMaintenance(
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
      setSubcategoriesLoading(false);
    }
  };

  const filteredSubs = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    if (!searchInteracted) return [];
    if (keyword.length < 2) return [];

    return subcategories
      .filter((sub) => {
        const haystack = [
          sub?.name,
          sub?.provider,
          sub?.category?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(keyword);
      })
      .slice(0, 8);
  }, [deferredSearch, subcategories, searchInteracted]);

  const handleSearchFocus = () => {
    setSearchInteracted(true);
    setSearchOpen(true);
    ensureSubcategoriesLoaded();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);
    setSearchInteracted(true);
    setSearchOpen(true);

    if (value.trim().length >= 2) {
      ensureSubcategoriesLoaded();
    }
  };

  const handleSelectSub = (subId) => {
    if (searchMaintenance) {
      alert(searchMaintenance);
      return;
    }

    setSearch("");
    setSearchOpen(false);

    beginTransition("/customer/category/product", "Menyiapkan hasil pencarian...");
    router.replace(`/customer/category/product?subcategory=${subId}`);
  };

  const placeholder = subcategoriesLoading
    ? "Memuat katalog..."
    : searchMaintenance || "Cari produk...";

  return (
    <div ref={searchRef} className="group relative ml-6 hidden w-[320px] lg:block">
      <span
        className="
          pointer-events-none
          absolute left-4 top-1/2 -translate-y-1/2
          text-purple-400/80 transition
          group-focus-within:text-purple-500
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          <path d="M21 38c9.389 0 17-7.611 17-17S30.389 4 21 4S4 11.611 4 21s7.611 17 17 17Z" />
          <path
            strokeLinecap="round"
            d="M26.657 14.343A7.98 7.98 0 0 0 21 12a7.98 7.98 0 0 0-5.657 2.343m17.879 18.879l8.485 8.485"
          />
        </svg>
      </span>

      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleSearchChange}
        onFocus={handleSearchFocus}
        className="
          w-full rounded-full
          border border-purple-300/40
          bg-white/95
          py-2.5 pl-11 pr-4
          text-sm text-zinc-900
          shadow-sm transition-all duration-300
          placeholder:text-zinc-400
          hover:shadow-md
          focus:border-purple-500
          focus:outline-none
          focus:ring-2 focus:ring-purple-500/30
        "
      />

      {searchOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-purple-700/40 bg-[#12001f] shadow-2xl">
          {searchMaintenance ? (
            <div className="px-4 py-4 text-sm text-purple-200">
              {searchMaintenance}
            </div>
          ) : subcategoriesLoading && filteredSubs.length === 0 ? (
            <div className="px-4 py-4 text-sm text-white/60">
              Memuat subkategori...
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="px-4 py-4 text-sm text-white/60">
              Tidak ada hasil yang cocok.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {filteredSubs.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectSub(sub.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-purple-700/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-white">
                      {sub?.name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-purple-300/80">
                      {[sub?.provider, sub?.category?.name].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}