"use client";

import dynamic from "next/dynamic";
import { Heart } from "lucide-react";
import NavbarShellClient from "./navbar/customer/NavbarShellClient";
import NavbarLogo from "./navbar/customer/NavbarLogo";
import NavbarMenu from "./navbar/customer/NavbarMenu";
import AppTransitionLink from "./AppTransitionLink";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext";
import { useCustomerNavbar } from "../context/CustomerNavbarContext";

const NavbarSearchClient = dynamic(
  () => import("./navbar/customer/NavbarSearchClient"),
  { ssr: false }
);

const NavbarCartClient = dynamic(
  () => import("./navbar/customer/NavbarCartClient"),
  { ssr: false }
);

const NavbarUserMenuClient = dynamic(
  () => import("./navbar/customer/NavbarUserMenuClient"),
  { ssr: false }
);

export default function NavbarCustomerClient({ initialShellData = null }) {
  const { brand } = useWebsiteSettings();
  const { favoriteCount } = useCustomerNavbar();
  const initialUser = initialShellData?.auth?.user || null;

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
