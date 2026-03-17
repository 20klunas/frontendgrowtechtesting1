"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

import SkeletonCard from "../components/customer/SkeletonCard";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext";

// Lazy load components
const BannerCarousel = dynamic(
  () => import("../components/customer/BannerCarousel"),
  { ssr: false }
);

const Popup = dynamic(
  () => import("../components/customer/Popup"),
  { ssr: false }
);

export default function CustomerHomeClient({
  banners,
  popup,
  products,
  catalogMaintenance,
}) {

  const { brand } = useWebsiteSettings();
  const [open, setOpen] = useState(true);

  const catalogDisabled = Boolean(catalogMaintenance);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">

      {popup && open && (
        <Popup
          title={popup?.title}
          content={popup?.content}
          image={popup?.image_url}
          ctaText={popup?.cta_text}
          ctaUrl={popup?.cta_url}
          onClose={() => setOpen(false)}
        />
      )}

      {/* HERO */}

      <section className="relative overflow-hidden">

        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-700/20 blur-[140px] rounded-full" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-28 grid lg:grid-cols-2 gap-16 items-center">

          <div className="opacity-0 animate-fadeInUp">

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">

              <span>{brand?.home_title || "Growtech Central"}</span>

              <br />

              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                {brand?.home_subtitle || "Toko Digital Terpercaya"}
              </span>

            </h1>

            {brand?.description && (
              <p className="mt-6 text-gray-300 max-w-xl">
                {brand.description}
              </p>
            )}

            <div className="mt-8 flex gap-4">

              {catalogDisabled ? (
                <button
                  disabled
                  className="bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-lg text-zinc-400"
                >
                  Katalog Maintenance
                </button>
              ) : (
                <Link
                  href="/customer/category"
                  className="px-7 py-3 rounded-xl bg-purple-600 hover:bg-purple-700"
                >
                  Jelajahi Katalog
                </Link>
              )}

              <Link
                href="/customer/faq"
                className="px-7 py-3 rounded-xl border border-purple-500 text-purple-300"
              >
                Informasi
              </Link>

            </div>

            {catalogDisabled && (
              <p className="mt-4 text-sm text-amber-300">
                {catalogMaintenance}
              </p>
            )}

          </div>

          <div className="flex justify-center lg:justify-end">

            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={420}
              height={420}
              priority
            />

          </div>

        </div>

      </section>

      {/* BANNER */}

      <section className="py-24">
        <BannerCarousel banners={banners} autoplay loop />
      </section>

      {/* PRODUCTS */}

      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-28">

        <h2 className="text-3xl font-bold text-purple-400 mb-12">
          Produk Populer
        </h2>

        {catalogDisabled ? (

          <FeatureMaintenanceCard
            title="Katalog sedang maintenance"
            message={catalogMaintenance}
          />

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {products.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : products.map((product) => {

                  const price =
                    product?.tier_pricing?.member ??
                    product?.tier_pricing?.guest ??
                    0;

                  return (

                    <Link
                      key={product.id}
                      href={`/customer/category/product/${product.id}`}
                      className="group block rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black overflow-hidden"
                    >

                      <div className="relative h-[180px]">

                        <Image
                          src={
                            product?.subcategory?.image_url ||
                            "/placeholder.png"
                          }
                          alt={product.name}
                          fill
                          className="object-cover"
                        />

                      </div>

                      <div className="p-4">

                        <h3 className="font-semibold line-clamp-1">
                          {product.name}
                        </h3>

                        <p className="text-xs text-gray-400">
                          Stok {product.available_stock ?? 0}
                        </p>

                        <p className="font-bold text-green-400 mt-2">
                          Rp {price.toLocaleString("id-ID")}
                        </p>

                      </div>

                    </Link>

                  );
                })}

          </div>

        )}

      </section>

    </main>
  );

}

function FeatureMaintenanceCard({ title, message }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 p-6 text-center">
      <h3 className="text-lg font-semibold text-amber-400">{title}</h3>
      <p className="text-sm text-amber-300 mt-2">{message}</p>
    </div>
  );
}