"use client";

import Link from "next/link";
import { useAppTransition } from "../hooks/useAppTransition";

function normalizeTargetPath(href) {
  if (!href) return "";

  if (typeof href === "string") {
    return href.split("?")[0].split("#")[0];
  }

  if (typeof href === "object" && href.pathname) {
    return href.pathname;
  }

  return "";
}

export default function AppTransitionLink({
  href,
  transitionMessage = "Menyiapkan halaman...",
  onClick,
  children,
  target,
  ...props
}) {
  const { beginTransition } = useAppTransition();

  const handleClick = (event) => {
    onClick?.(event);

    // kalau sudah di-prevent
    if (event.defaultPrevented) return;

    // buka di tab baru
    if (target === "_blank") return;

    // ⛔ FIX: semua pakai ||
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    // bukan klik kiri
    if (event.button !== 0) return;

    const targetPath = normalizeTargetPath(href);
    if (!targetPath) return;

    const currentPath = window.location.pathname;

    if (currentPath === targetPath) return;

    beginTransition(targetPath, transitionMessage);
  };

  return (
    <Link href={href} target={target} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}