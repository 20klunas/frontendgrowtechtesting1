import Link from "next/link";
import BannerCarousel from "../components/customer/BannerCarousel";
import ProductCard from "../components/customer/ProductCardPopular";
import HomePopupClient from "../components/customer/home/HomePopupClient";
import HomeHeroClient from "../components/customer/home/HomeHeroClient";
import SectionReveal from "../components/customer/home/SectionReveal";
import { getCustomerHomeServerData } from "../lib/serverCustomerHome";

export default async function CustomerHomePage() {
  const { popup, banners, products, catalogMaintenance } =
    await getCustomerHomeServerData();

  const catalogDisabled = Boolean(catalogMaintenance);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <HomePopupClient popup={popup} />

      <HomeHeroClient
        catalogDisabled={catalogDisabled}
        catalogMaintenance={catalogMaintenance}
      />

      <section className="w-full pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatItem title="10K+" subtitle="Produk Terjual" />
            <StatItem title="100%" subtitle="Aman & Terpercaya" />
            <StatItem title="24/7" subtitle="Dukungan Pelanggan" />
          </div>
        </div>
      </section>

      <section className="py-24">
        <BannerCarousel banners={banners || []} autoplay loop />
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-28">
        <SectionReveal className="text-3xl font-bold text-purple-400 mb-12">
          Produk Populer
        </SectionReveal>

        {catalogDisabled ? (
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

function StatItem({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black p-6 text-center hover:border-purple-500 transition">
      <h3 className="text-3xl font-bold text-purple-400 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}