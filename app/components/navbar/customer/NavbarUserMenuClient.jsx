"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { cn } from "../../../lib/utils";
import AppTransitionLink from "../../AppTransitionLink";

const MENU_ITEMS = [
  ["👤", "Profile", "/customer/profile", "Menyiapkan profil Anda..."],
  ["🎯", "Referral", "/customer/referral", "Menyiapkan halaman referral..."],
  ["💰", "Top Up", "/customer/topup", "Menyiapkan halaman top up..."],
];

export default function NavbarUserMenuClient({ initialUser = null }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const displayUser = user || initialUser || null;
  const avatarSrc = displayUser?.avatar_url || displayUser?.avatar || null;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  if (loading && !displayUser) return null;
  if (!displayUser) return null;

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setOpen((prev) => !prev)} className="flex items-center gap-2">
        <div className="hidden text-right leading-tight md:block">
          <div className="text-sm font-semibold text-white">
            {displayUser?.name || displayUser?.full_name || "User"}
          </div>
          <div className="text-xs capitalize text-purple-300">
            {displayUser?.tier || "member"}
          </div>
        </div>

        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-purple-600">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt="Avatar"
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white">
              👤
            </div>
          )}
        </div>
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-14 w-48 overflow-hidden rounded-xl
            border border-purple-700/60 bg-[#14002a] shadow-xl
          "
        >
          {MENU_ITEMS.map(([icon, label, href, message]) => (
            <AppTransitionLink
              key={label}
              href={href}
              transitionMessage={message}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm transition",
                isActive(href)
                  ? "bg-purple-700/40 text-white"
                  : "text-white/80 hover:bg-purple-700/30"
              )}
            >
              <span>{icon}</span>
              {label}
            </AppTransitionLink>
          ))}

          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
          >
            ⎋ Log Out
          </button>
        </div>
      )}
    </div>
  );
}