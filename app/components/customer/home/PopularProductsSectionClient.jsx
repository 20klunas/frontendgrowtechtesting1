"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import ProductCard from "../ProductCardPopular";
import SectionReveal from "./SectionReveal";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API) {
    return normalizedPath;
  }

  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`;
  }

  return `${API}${normalizedPath}`;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload, fallback) {
  return (
    payload?.message ||
    payload?.error?.message ||
    payload?.meta?.message ||
    payload?.data?.message ||
    fallback
  );
}

function isFeatureMaintenancePayload(payload, featureKey) {
  const text = JSON.stringify(payload || {}).toLowerCase();
  const feature = String(featureKey || "").toLowerCase();

  const hasMaintenanceKeyword =
    text.includes("maintenance") ||
    text.includes("feature_maintenance") ||
    text.includes("feature maintenance");

  if (!hasMaintenanceKeyword) {
    return false;
  }

  if (!feature) {
    return true;
  }

  return text.includes(feature);
}

export default function PopularProductsSectionClient({
  initialProducts = [],
  initialCatalogMaintenance = "",
}) {
  const safeInitialProducts = Array.isArray(initialProducts)
    ? initialProducts
    : [];

  const [products, setProducts] = useState(safeInitialProducts);
  const [catalogMaintenance, setCatalogMaintenance] = useState(
    initialCatalogMaintenance || ""
  );
  const [loading, setLoading] = useState(
    safeInitialProducts.length === 0 && !initialCatalogMaintenance
  );

  const hasInitialProducts = useMemo(
    () => safeInitialProducts.length > 0,
    [safeInitialProducts]
  );

  useEffect(() => {
    let active = true;

    async function fetchPopularProductsOnClient() {
      try {
        setLoading(true);

        const token = Cookies.get("token");
        const headers = {
          Accept: "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          buildApiUrl("/api/v1/catalog/products?sort=popular&per_page=4"),
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

        const payload = await parseJsonSafe(response);

        if (!response.ok) {
          if (isFeatureMaintenancePayload(payload, "catalog_access")) {
            if (!active) return;

            setCatalogMaintenance(
              getErrorMessage(payload, "Katalog sedang maintenance.")
            );
            setProducts([]);
            return;
          }

          if (!active) return;

          setProducts([]);
          return;
        }

        if (!active) return;

        setProducts(payload?.data?.data || []);
        setCatalogMaintenance("");
      } catch (error) {
        if (!active) return;

        console.error("Failed to fetch popular products on client:", error);
        setProducts([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (hasInitialProducts || initialCatalogMaintenance) {
      setLoading(false);
      return;
    }

    fetchPopularProductsOnClient();

    return () => {
      active = false;
    };
  }, [hasInitialProducts, initialCatalogMaintenance]);

  const catalogDisabled = Boolean(catalogMaintenance);

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8 py-28">
      <SectionReveal className="text-3xl font-bold text-purple-400 mb-12">
        Produk Populer
      </SectionReveal>

      {loading ? (
        <LoadingGrid />
      ) : catalogDisabled ? (
        <FeatureMaintenanceCard
          title="Katalog sedang maintenance"
          message={catalogMaintenance}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="hover:-translate-y-1 hover:scale-[1.02] transition duration-200"
                >
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <EmptyPopularProducts />
            )}
          </div>

          <div className="flex justify-center mt-14">
            <Link
              href="/customer/category"
              className="px-8 py-3 rounded-xl border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
            >
              Lihat Semua Produk
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function FeatureMaintenanceCard({ title, message }) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
      <h3 className="text-xl font-semibold text-amber-300 mb-2">{title}</h3>
      <p className="text-amber-100/90">{message}</p>
    </div>
  );
}

function EmptyPopularProducts() {
  return (
    <div className="col-span-full rounded-2xl border border-purple-800/40 bg-zinc-950 p-8 text-center text-zinc-400">
      Produk populer belum tersedia saat ini.
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black overflow-hidden animate-pulse"
        >
          <div className="h-[180px] bg-zinc-800" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-zinc-800 rounded" />
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
            <div className="h-5 bg-zinc-800 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}