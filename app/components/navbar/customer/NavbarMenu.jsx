"use client";

import { usePathname } from "next/navigation";
import { cn } from "../../../lib/utils";
import AppTransitionLink from "../../AppTransitionLink";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/customer",
    message: "Menyiapkan beranda customer...",
  },
  {
    label: "Product",
    href: "/customer/category",
    message: "Menyiapkan katalog produk...",
  },
];

export default function NavbarMenu() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`)
  };

  return (
    <>
      <div className="relative hidden items-center gap-8 lg:flex">
        {NAV_ITEMS.map((item) => (
          <AppTransitionLink
            key={item.href}
            href={item.href}
            transitionMessage={item.message}
            className={cn(
              "relative px-2 py-1 text-sm font-medium transition",
              isActive(item.href)
                ? "text-white"
                : "text-white/70 hover:text-white"
            )}
          >
            {item.label}

            {isActive(item.href) && (
              <span className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-purple-500" />
            )}
          </AppTransitionLink>
        ))}
      </div>

      <div className="flex items-center gap-3 lg:hidden">
        {NAV_ITEMS.map((item) => (
          <AppTransitionLink
            key={item.href}
            href={item.href}
            transitionMessage={item.message}
            className={cn(
              "text-sm font-medium",
              isActive(item.href) ? "text-purple-300" : "text-white/80"
            )}
          >
            {item.label}
          </AppTransitionLink>
        ))}
      </div>
    </>
  );
}