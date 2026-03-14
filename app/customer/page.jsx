"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import BannerCarousel from "../components/customer/BannerCarousel";
import Popup from "../components/customer/Popup";
import { publicFetch } from "../lib/publicFetch";
import { authFetch } from "../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../lib/maintenanceHandler";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext";

export default function CustomerHomePage() {
  const { brand } = useWebsiteSettings();

  const [popup, setPopup] = useState(null);
  const [open, setOpen] = useState(true);
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogMaintenance, setCatalogMaintenance] = useState("");

  useEffect(() => {
    let active = true;

    publicFetch("/api/v1/content/banners")
      .then((res) => {
        if (!active) return;
        setBanners(res.data || []);
      })
      .catch((err) => {
        if (!active) return;
        if (!isMaintenanceError(err)) {
          console.error(err);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    publicFetch("/api/v1/content/popup")
      .then((res) => {
        if (!active) return;

        if (res?.data?.is_active) {
          setPopup(res.data);
          setOpen(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        if (!isMaintenanceError(err)) {
          console.error(err);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchPopularProducts = async () => {
      try {
        setLoadingProducts(true);
        setCatalogMaintenance("");

        const res = await authFetch("/api/v1/catalog/products?sort=popular&per_page=4");

        if (!active) return;

        setProducts(res?.data?.data || []);
      } catch (err) {
        if (!active) return;

        if (isFeatureMaintenanceError(err, "catalog_access")) {
          setCatalogMaintenance(
            getMaintenanceMessage(err, "Katalog sedang maintenance.")
          );
          setProducts([]);
          return;
        }

        if (!isMaintenanceError(err)) {
          console.error("Failed fetch popular products:", err);
        }

        setProducts([]);
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    };

    fetchPopularProducts();

    return () => {
      active = false;
    };
  }, []);

  const catalogDisabled = Boolean(catalogMaintenance);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {popup && open && popup?.is_active && (
        <Popup
          title={popup?.title}
          content={popup?.content}
          image={popup?.image_url}
          ctaText={popup?.cta_text}
          ctaUrl={popup?.cta_url}
          onClose={() => setOpen(false)}
        />
      )}

      <section className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-700/20 blur-[200px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-28 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {brand?.home_title || "Growtech Central"}
              </span>

              <br />

              <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                {brand?.home_subtitle || "Toko Digital Terpercaya"}
              </span>
            </h1>

            {brand?.description && (
              <p className="mt-6 max-w-xl text-gray-300 leading-relaxed text-lg">
                {brand.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              {catalogDisabled ? (
                <button
                  type="button"
                  disabled
                  title={catalogMaintenance}
                  className="bg-zinc-800/80 border border-zinc-700 px-6 py-3 rounded-lg font-semibold text-zinc-400 cursor-not-allowed"
                >
                  Katalog Maintenance
                </button>
              ) : (
                <Link
                  href="/customer/category"
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold shadow-xl shadow-purple-900/40 transition hover:scale-105"
                >
                  Jelajahi Katalog
                </Link>
              )}

              <Link
                href="/customer/faq"
                className="border border-purple-500 px-6 py-3 rounded-lg text-purple-300 hover:bg-purple-500/10 transition"
              >
                Informasi Lebih Lanjut
              </Link>
            </div>

            {catalogDisabled && (
              <p className="mt-4 text-sm text-amber-300">
                {catalogMaintenance}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center lg:justify-end"
          >
            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={420}
              height={420}
              priority
              className="drop-shadow-[0_0_90px_rgba(168,85,247,0.9)] animate-pulse"
            />
          </motion.div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 border border-purple-800/60 rounded-xl overflow-hidden backdrop-blur bg-black/30"
          >
            {[
              ["10K+", "Produk Tersedia"],
              ["100%", "Aman & Terpercaya"],
              ["24/7", "Dukungan Pelanggan"],
            ].map(([val, label], i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-purple-900/20 to-black hover:bg-purple-900/30 transition"
              >
                <span className="text-3xl font-bold text-purple-400">{val}</span>
                <span className="text-sm text-gray-300 mt-1">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mt-16">
        <BannerCarousel banners={banners || []} autoplay loop />
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-8 pt-24 pb-32">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-purple-400 mb-10"
        >
          Produk Populer
        </motion.h2>

        {catalogDisabled ? (
          <FeatureMaintenanceCard
            title="Katalog sedang maintenance"
            message={catalogMaintenance}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {loadingProducts ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                products.map((product) => {
                  const price =
                    product?.tier_pricing?.member ??
                    product?.tier_pricing?.guest ??
                    0;

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -6, scale: 1.03 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Link
                        href={`/customer/category/product/${product.id}`}
                        className="group block rounded-2xl border border-purple-700 bg-gradient-to-b from-zinc-900 to-black overflow-hidden hover:border-purple-500 transition shadow-lg hover:shadow-purple-900/40"
                      >
                        <div className="relative h-[170px] bg-white overflow-hidden">
                          <Image
                            src={product?.subcategory?.image_url || "/placeholder.png"}
                            width={300}
                            height={200}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          />
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1 line-clamp-1">
                            {product.name}
                          </h3>

                          <p className="text-xs text-gray-400 mb-2">
                            Stok {product.available_stock ?? 0}
                          </p>

                          <div className="flex items-center text-yellow-400 text-sm mb-2">
                            {"★".repeat(Math.round(product.rating || 0))}
                            {"☆".repeat(5 - Math.round(product.rating || 0))}
                            <span className="text-xs text-gray-400 ml-2">
                              ({product.rating_count || 0})
                            </span>
                          </div>

                          <p className="font-bold text-green-400">
                            Rp {price.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex justify-center mt-12"
            >
              <Link
                href="/customer/category"
                className="px-8 py-3 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
              >
                Lihat Semua Produk
              </Link>
            </motion.div>
          </>
        )}
      </section>
    </main>
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

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-purple-700 bg-black overflow-hidden animate-pulse">
      <div className="h-[170px] bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
      </div>
    </div>
  );
}