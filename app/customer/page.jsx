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

        const res = await authFetch(
          "/api/v1/catalog/products?sort=popular&per_page=4"
        );

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

      {/* HERO SECTION */}

      <section className="relative overflow-hidden">

        {/* glow background */}

        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-700/20 blur-[140px] rounded-full pointer-events-none z-0" />

        {/* gradient overlay */}

        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black/40 to-black pointer-events-none z-0" />

        {/* HERO CONTENT */}

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* TEXT */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">

              <span className="text-white">
                {brand?.home_title || "Growtech Central"}
              </span>

              <br />

              <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                {brand?.home_subtitle || "Toko Digital Terpercaya"}
              </span>

            </h1>

            {brand?.description && (
              <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-xl">
                {brand.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-4">

              {catalogDisabled ? (
                <button
                  disabled
                  title={catalogMaintenance}
                  className="bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-lg text-zinc-400 cursor-not-allowed"
                >
                  Katalog Maintenance
                </button>
              ) : (
                <Link
                  href="/customer/category"
                  className="px-7 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg shadow-purple-900/40 transition hover:scale-[1.03]"
                >
                  Jelajahi Katalog
                </Link>
              )}

              <Link
                href="/customer/faq"
                className="px-7 py-3 rounded-xl border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
              >
                Informasi
              </Link>

            </div>

            {catalogDisabled && (
              <p className="mt-4 text-sm text-amber-300">
                {catalogMaintenance}
              </p>
            )}

          </motion.div>

          {/* HERO IMAGE */}

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex justify-center lg:justify-end"
          >

            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={420}
              height={420}
              priority
              className="drop-shadow-[0_0_70px_rgba(168,85,247,0.8)]"
            />

          </motion.div>

        </div>
      </section>

      {/* ============================================ */}
      {/* STATS */}
      {/* ============================================ */}

      <section className="w-full pb-20">

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <StatItem title="10K+" subtitle="Produk Terjual"/>
            <StatItem title="100%" subtitle="Aman & Terpercaya"/>
            <StatItem title="24/7" subtitle="Dukungan Pelanggan"/>

          </div>

        </div>

      </section>


      {/* BANNER */}

      <section className="py-24">
        <BannerCarousel banners={banners || []} autoplay loop />
      </section>

      {/* POPULAR PRODUCTS */}

      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-28">

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-purple-400 mb-12"
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
                        className="group block rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black overflow-hidden transition hover:border-purple-500 hover:shadow-xl hover:shadow-purple-900/30"
                      >

                        <div className="relative h-[180px] bg-white overflow-hidden">

                          <Image
                            src={
                              product?.subcategory?.image_url ||
                              "/placeholder.png"
                            }
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

      {/* CTA SECTION */}

      <section className="py-24 border-t border-purple-900/40 text-center">

        <h2 className="text-3xl font-bold mb-6">
          Siap mulai transaksi digital?
        </h2>

        <Link
          href="/customer/category"
          className="inline-block px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold shadow-lg shadow-purple-900/40 transition"
        >
          Jelajahi Produk
        </Link>

      </section>

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

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-purple-800 bg-black overflow-hidden animate-pulse">
      <div className="h-[180px] bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
      </div>
    </div>
  );
}
function StatItem({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black p-6 text-center hover:border-purple-500 transition">
      
      <h3 className="text-3xl font-bold text-purple-400 mb-2">
        {title}
      </h3>

      <p className="text-gray-400 text-sm">
        {subtitle}
      </p>

    </div>
  );
}