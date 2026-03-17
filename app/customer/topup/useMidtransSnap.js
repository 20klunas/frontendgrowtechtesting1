"use client";

import { useCallback, useState } from "react";

const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

function loadSnapScript(clientKey) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window tidak tersedia"));
      return;
    }

    if (window.snap) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${MIDTRANS_SNAP_URL}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Gagal memuat Midtrans Snap")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = MIDTRANS_SNAP_URL;
    script.async = true;
    script.setAttribute("data-client-key", clientKey || "");

    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error("Gagal memuat Midtrans Snap"));

    document.body.appendChild(script);
  });
}

export default function useMidtransSnap(clientKey) {
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(
    typeof window !== "undefined" && !!window.snap
  );

  const ensureSnapLoaded = useCallback(async () => {
    if (typeof window === "undefined") return false;

    if (window.snap) {
      setSnapReady(true);
      return true;
    }

    if (!clientKey) {
      return false;
    }

    setSnapLoading(true);

    try {
      await loadSnapScript(clientKey);
      setSnapReady(true);
      return true;
    } finally {
      setSnapLoading(false);
    }
  }, [clientKey]);

  const openSnap = useCallback(
    async (snapToken, callbacks = {}) => {
      const ready = await ensureSnapLoaded();

      if (!ready || !window.snap) {
        throw new Error("Midtrans Snap belum siap");
      }

      window.snap.pay(snapToken, callbacks);
    },
    [ensureSnapLoaded]
  );

  return {
    snapLoading,
    snapReady,
    ensureSnapLoaded,
    openSnap,
  };
}