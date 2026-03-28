"use client";

import dynamic from "next/dynamic";
import { Heart } from "lucide-react";

import NavbarShellClient from "./navbar/customer/NavbarShellClient";
import NavbarLogo from "./navbar/customer/NavbarLogo";
import NavbarMenu from "./navbar/customer/NavbarMenu";
import AppTransitionLink from "./AppTransitionLink";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext";

const NavbarSearchClient = dynamic(
  () => import("./navbar/customer/NavbarSearchClient"),
  {
    loading: () => (
      <div className="ml-6 hidden w-[320px] lg:block">
        <div className="h-[42px] w-full rounded-full border border-purple-300/40 bg-white/95" />
      </div>
    ),
  }
);

const NavbarCartClient = dynamic(
  () => import("./navbar/customer/NavbarCartClient"),
  {
    loading: () => (
      <div className="relative text-white">
        🛒
      </div>
    ),
  }
);

const NavbarUserMenuClient = dynamic(
  () => import("./navbar/customer/NavbarUserMenuClient"),
  {
    loading: () => (
      <div className="flex items-center gap-2">
        <div className="hidden text-right leading-tight md:block">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="mt-1 h-3 w-12 rounded bg-white/10" />
        </div>
        <div className="h-8 w-8 rounded-full bg-purple-600" />
      </div>
    ),
  }
);

export default function NavbarCustomerClient({ initialShellData = null }) {
  const { brand } = useWebsiteSettings();

  const initialUser = initialShellData?.auth?.user || null;
  const favoriteCount = Number(initialShellData?.nav?.favorite_count || 0);

  return (
    <NavbarShellClient>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4">
        <NavbarLogo brand={brand} />

        <div className="flex min-w-0 flex-1 items-center justify-center gap-8">
          <NavbarMenu />
          <NavbarSearchClient />
        </div>

        <div className="relative flex items-center gap-3">
          <AppTransitionLink
            href="/customer/favorites"
            transitionMessage="Menyiapkan halaman favorit..."
            className="relative text-white transition hover:text-pink-400"
          >
            <Heart size={20} />
            {favoriteCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white">
                {favoriteCount > 99 ? "99+" : favoriteCount}
              </span>
            )}
          </AppTransitionLink>

          <NavbarCartClient />
          <NavbarUserMenuClient initialUser={initialUser} />
        </div>
      </div>
    </NavbarShellClient>
  );
}