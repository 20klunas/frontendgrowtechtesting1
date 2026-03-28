import Link from "next/link";
import BannerCarousel from "../components/customer/BannerCarousel";
import HomePopupClient from "../components/customer/home/HomePopupClient";
import HomeHeroClient from "../components/customer/home/HomeHeroClient";
import PopularProductsSectionClient from "../components/customer/home/PopularProductsSectionClient";
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

      {Array.isArray(banners) && banners.length > 0 && (
        <section className="py-24">
          <BannerCarousel banners={banners} autoplay loop />
        </section>
      )}

      <PopularProductsSectionClient
        initialProducts={products}
        initialCatalogMaintenance={catalogMaintenance}
      />

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

function StatItem({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black p-6 text-center hover:border-purple-500 transition">
      <h3 className="text-3xl font-bold text-purple-400 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}