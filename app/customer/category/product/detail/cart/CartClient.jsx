"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "../../../../../lib/authFetch";
import { clearCheckoutBootstrapCache, writeCheckoutBootstrapCache } from "../../../../../lib/clientBootstrap";
import Toast from "../../../../../components/ui/Toast";
import useCheckoutAccess from "../../../../../hooks/useCheckoutAccess";
import { normalizeCartPayload } from "./cartApi";
import { CUSTOMER_CART_REFRESH_EVENT, notifyCustomerCartChanged } from "../../../../../lib/customerCartEvents";
function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatImageSrc(src) {
  return src || "/placeholder.png";
}


function buildFallbackSummary(items = []) {
  const subtotal = (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + (Number(item?.line_subtotal) || ((Number(item?.unit_price) || 0) * (Number(item?.qty) || 0))),
    0
  );

  return {
    subtotal,
    discount_total: 0,
    total: subtotal,
  };
}

function buildConfettiPieces(count = 24) {
  return Array.from({ length: count }).map((_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    rotate: `${Math.random() * 360}deg`,
    delay: `${Math.random() * 0.25}s`,
    duration: `${0.9 + Math.random() * 0.5}s`,
    background: `hsl(${Math.random() * 360}, 100%, 60%)`,
  }));
}

const CartItemRow = memo(function CartItemRow({
  item,
  busy,
  onIncrease,
  onDecrease,
  onRemove,
  onInputQty,
}) {
  const product = item.product;
  const unitPrice = item.unit_price || 0;
  const qty = item.qty || 1;
  const stock = item.stock_available ?? 0;
  const lineSubtotal = item.line_subtotal || unitPrice * qty;

  return (
    <div className="rounded-2xl border border-purple-700 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 transition-all duration-300 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:scale-[1.01]">
      <div className="flex items-center gap-4 sm:block">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-transparent flex items-center justify-center shrink-0">
          <Image
            src={formatImageSrc(product?.subcategory?.image_url)}
            alt={product?.name || "Product"}
            width={70}
            height={70}
            sizes="80px"
            className="object-contain"
          />
        </div>

        <div className="sm:hidden">
          <h3 className="font-semibold text-sm">{product?.name}</h3>
          <p className="text-xs text-gray-400">
            {formatRupiah(unitPrice)} / item
          </p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="hidden sm:block font-semibold text-lg">
          {product?.name}
        </h3>

        <p className="hidden sm:block text-sm text-gray-400">
          {formatRupiah(unitPrice)} / item
        </p>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onDecrease}
            disabled={busy || qty <= 1}
            className="w-7 h-7 rounded bg-purple-700/40 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>

          <input
            type="number"
            min={1}
            max={Math.max(1, stock)}
            value={qty}
            onChange={(e) => onInputQty?.(e.target.value)}
            disabled={busy}
            className="w-16 rounded bg-transparent border border-purple-700 px-2 py-1 text-center text-sm"
          />

          <button
            onClick={onIncrease}
            disabled={busy || qty >= stock}
            className="w-7 h-7 rounded bg-purple-700/40 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>

          <span className="text-xs text-gray-500 ml-2">Stock: {stock}</span>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-none border-white/5">
        <p className="font-semibold text-sm sm:text-base">
          {formatRupiah(lineSubtotal)}
        </p>

        <button
          onClick={onRemove}
          disabled={busy}
          className="opacity-70 hover:opacity-100 hover:scale-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="#fff"
              d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM8 9h8v10H8zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

function UnauthorizedState() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <p className="text-gray-400 mb-4">
        Kamu harus login untuk melihat keranjang
      </p>

      <Link
        href="/login"
        className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition"
      >
        Login Sekarang
      </Link>
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </main>
  );
}

export default function CartClient({ initialItems, initialSummary }) {
  const router = useRouter();

  const [items, setItems] = useState(Array.isArray(initialItems) ? initialItems : []);
  const [summary, setSummary] = useState(
    initialSummary || {
      subtotal: 0,
      discount_total: 0,
      total: 0,
    }
  );
  const [previewSummary, setPreviewSummary] = useState(
    initialSummary || {
      subtotal: 0,
      discount_total: 0,
      total: 0,
    }
  );

  const [cartLoading, setCartLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [voucher, setVoucher] = useState("");
  const [voucherValid, setVoucherValid] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const { loading: accessLoading, allowed, message } = useCheckoutAccess();
  const showToast = useCallback((message) => {
    setToastMessage(message);
    window.clearTimeout(window.__gtCartToastTimer);
    window.__gtCartToastTimer = window.setTimeout(() => setToastMessage(""), 2200);
  }, []);


  const debounceRef = useRef(null);
  const previewRequestIdRef = useRef(0);
  const confettiTimeoutRef = useRef(null);

  const [flip, setFlip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const confettiPieces = useMemo(
    () => (showConfetti ? buildConfettiPieces(25) : []),
    [showConfetti]
  );

  const applyNormalizedCart = useCallback((payload) => {
    const normalized = normalizeCartPayload({ data: payload || {} });
    setItems(normalized.items);
    setSummary(normalized.summary);
    setPreviewSummary((current) => {
      const hasVoucher = voucher.trim().length > 0;
      return hasVoucher ? current : normalized.summary;
    });
  }, [voucher]);

  const markUnauthorizedIfNeeded = useCallback((error) => {
    if (String(error?.message || "").includes("Unauthorized")) {
      setUnauthorized(true);
      return true;
    }

    return false;
  }, []);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);

    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current);
    }

    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(false);
    }, 1200);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      setCartLoading(true);

      const json = await authFetch("/api/v1/cart");
      const normalized = normalizeCartPayload(json);

      setItems(normalized.items);
      setSummary(normalized.summary);
      setPreviewSummary((current) => (voucher.trim() ? current : normalized.summary));
    } catch (error) {
      console.error("Fetch cart error:", error?.message || error);

      if (!markUnauthorizedIfNeeded(error)) {
        setItems([]);
      }
    } finally {
      setCartLoading(false);
    }
  }, [markUnauthorizedIfNeeded]);

  const previewVoucher = useCallback(
    async (code) => {
      const trimmedCode = String(code || "").trim();

      if (!trimmedCode) {
        setVoucherValid(null);
        setPreviewSummary(summary);
        setPreviewLoading(false);
        return;
      }

      const requestId = ++previewRequestIdRef.current;

      try {
        setPreviewLoading(true);

        const json = await authFetch(
          `/api/v1/cart/checkout?voucher_code=${encodeURIComponent(trimmedCode)}`
        );

        if (requestId !== previewRequestIdRef.current) return;

        if (json?.success) {
          setVoucherValid(true);
          setPreviewSummary(json.data?.summary || summary);
          triggerConfetti();
        } else {
          setVoucherValid(false);
          setPreviewSummary(summary);
        }
      } catch (error) {
        if (requestId !== previewRequestIdRef.current) return;

        setVoucherValid(false);
        setPreviewSummary(summary);

        if (markUnauthorizedIfNeeded(error)) {
          return;
        }
      } finally {
        if (requestId === previewRequestIdRef.current) {
          setPreviewLoading(false);
        }
      }
    },
    [summary, triggerConfetti, markUnauthorizedIfNeeded]
  );

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const handleCartRefresh = (event) => {
      const detail = event?.detail || {};
      const actionType = String(detail?.type || "refresh").toLowerCase();

      if (actionType === "server-snapshot" && Array.isArray(detail?.items)) {
        applyNormalizedCart({
          items: detail.items,
          summary: detail.summary || buildFallbackSummary(detail.items),
        });
        return;
      }

      if (actionType === "add" && detail?.item) {
        const incomingQty = Math.max(1, Number(detail.item.qty) || 1);
        const incomingProductId = Number(detail.item.product_id || detail.item.id || 0);

        if (incomingProductId > 0) {
          const nextItems = [...items];
          const existingIndex = nextItems.findIndex((row) => Number(row?.product_id || row?.product?.id || row?.id || 0) === incomingProductId);

          if (existingIndex >= 0) {
            const currentRow = nextItems[existingIndex];
            const unitPrice = Number(currentRow?.unit_price || detail.item?.unit_price || 0);
            const qty = Math.max(1, Number(currentRow?.qty || 1)) + incomingQty;
            nextItems[existingIndex] = {
              ...currentRow,
              ...detail.item,
              qty,
              unit_price: unitPrice,
              line_subtotal: unitPrice * qty,
            };
          } else {
            const unitPrice = Number(detail.item?.unit_price || 0);
            nextItems.unshift({
              ...detail.item,
              id: detail.item?.id || `temp-${incomingProductId}`,
              product_id: incomingProductId,
              qty: incomingQty,
              unit_price: unitPrice,
              line_subtotal: unitPrice * incomingQty,
              stock_available: Number(detail.item?.stock_available || 99),
            });
          }

          applyNormalizedCart({ items: nextItems, summary: buildFallbackSummary(nextItems) });
        }
      }

      if (actionType === "update") {
        const itemId = Number(detail?.item_id || 0);
        const qty = Math.max(1, Number(detail?.qty) || 1);

        if (itemId > 0) {
          const nextItems = items.map((row) => (
            Number(row?.id || 0) === itemId
              ? {
                  ...row,
                  qty,
                  line_subtotal: Number(row?.unit_price || 0) * qty,
                }
              : row
          ));

          applyNormalizedCart({ items: nextItems, summary: buildFallbackSummary(nextItems) });
        }
      }

      if (actionType === "remove") {
        const itemId = Number(detail?.item_id || 0);
        if (itemId > 0) {
          const nextItems = items.filter((row) => Number(row?.id || 0) !== itemId);
          applyNormalizedCart({ items: nextItems, summary: buildFallbackSummary(nextItems) });
        }
      }

      if (actionType === "reset") {
        applyNormalizedCart({ items: [], summary: buildFallbackSummary([]) });
      }

      if (!detail?.skipServerSync) {
        refreshCart();
      }
    };

    window.addEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh);
    window.addEventListener("cart-updated", handleCartRefresh);

    return () => {
      window.removeEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh);
      window.removeEventListener("cart-updated", handleCartRefresh);
    };
  }, [items, refreshCart, applyNormalizedCart]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmedVoucher = voucher.trim();

    if (!trimmedVoucher) {
      setVoucherValid(null);
      setPreviewSummary(summary);
      setPreviewLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      previewVoucher(trimmedVoucher);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [voucher, summary, previewVoucher]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    };
  }, []);

  const baseSubtotal = summary?.subtotal ?? 0;
  const baseTotal = summary?.total ?? baseSubtotal;

  const subtotal = previewSummary?.subtotal ?? baseSubtotal;
  const discount = previewSummary?.discount_total ?? 0;
  const total = previewSummary?.total ?? subtotal;

  const savedAmount = Math.max(baseTotal - total, 0);
  const [syncing, setSyncing] = useState(false);

  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (prevTotalRef.current !== total) {
      setFlip(true);

      const timer = setTimeout(() => setFlip(false), 650);
      prevTotalRef.current = total;

      return () => clearTimeout(timer);
    }
  }, [total]);

  const handleCheckout = async () => {
    try {

      if (!items.length) {
        alert("Keranjang kosong");
        return;
      }

      setCheckoutLoading(true);

      // sync dulu
      const latestCart = await authFetch("/api/v1/cart")

      if (!latestCart?.data?.items?.length) {
        alert("Cart kosong (backend belum sync)");
        return;
      }

      const checkout = await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          voucher_code: voucher.trim() || null,
        }),
      });

      clearCheckoutBootstrapCache();
      writeCheckoutBootstrapCache({ checkout: checkout?.data || null });
      notifyCustomerCartChanged();
      router.push("/customer/category/product/detail/lengkapipembelian");
    } catch (error) {
      console.error("Checkout error:", error?.message || error);

      if (!markUnauthorizedIfNeeded(error)) {
        alert(error?.message || "Checkout gagal");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;

    const previousItems = items;
    const nextItems = items.map((row) => (
      Number(row?.id || 0) === Number(itemId)
        ? {
            ...row,
            qty: newQty,
            line_subtotal: Number(row?.unit_price || 0) * newQty,
          }
        : row
    ));

    setSyncing(true);

    try {
      setBusyItemId(itemId);
      applyNormalizedCart({ items: nextItems, summary: buildFallbackSummary(nextItems) });
      notifyCustomerCartChanged({
        type: "update",
        item_id: itemId,
        qty: newQty,
        skipServerSync: true,
      });

      const json = await authFetch(`/api/v1/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ qty: newQty }),
      });

      if (json?.success && Array.isArray(json?.data?.items)) {
        showToast("Item berhasil dihapus dari keranjang");
        applyNormalizedCart({ items: json.data.items, summary: json.data.summary || buildFallbackSummary(json.data.items) });
        notifyCustomerCartChanged({
          type: "server-snapshot",
          items: json.data.items,
          summary: json.data.summary,
          skipServerSync: true,
        });
      }
    } catch (error) {
      console.error("Update qty error:", error?.message || error);
      applyNormalizedCart({ items: previousItems, summary: buildFallbackSummary(previousItems) });
      notifyCustomerCartChanged({ type: "refresh" });

      if (!markUnauthorizedIfNeeded(error)) {
        showToast(error?.message || "Gagal update qty");
      }
    } finally {
      setBusyItemId(null);
      setSyncing(false);
    }
  };

  const removeItem = async (itemId) => {
    const previousItems = items;
    const nextItems = items.filter((row) => Number(row?.id || 0) !== Number(itemId));

    setSyncing(true);
    try {
      setBusyItemId(itemId);
      applyNormalizedCart({ items: nextItems, summary: buildFallbackSummary(nextItems) });
      notifyCustomerCartChanged({
        type: "remove",
        item_id: itemId,
        skipServerSync: true,
      });

      const json = await authFetch(`/api/v1/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (json?.success && Array.isArray(json?.data?.items)) {
        showToast("Jumlah item di keranjang berhasil diperbarui");
        applyNormalizedCart({ items: json.data.items, summary: json.data.summary || buildFallbackSummary(json.data.items) });
        notifyCustomerCartChanged({
          type: "server-snapshot",
          items: json.data.items,
          summary: json.data.summary,
          skipServerSync: true,
        });
      }
    } catch (error) {
      console.error("Remove item error:", error?.message || error);
      applyNormalizedCart({ items: previousItems, summary: buildFallbackSummary(previousItems) });
      notifyCustomerCartChanged({ type: "refresh" });

      if (!markUnauthorizedIfNeeded(error)) {
        showToast(error?.message || "Gagal hapus item");
      }
    } finally {
      setBusyItemId(null);
      setSyncing(false);
    }
  };

  if (unauthorized) {
    return <UnauthorizedState />;
  }

  const checkoutBlocked = accessLoading || !allowed;
  const isUpdating = syncing || busyItemId !== null || cartLoading;

  const checkoutButtonDisabled =
    checkoutLoading || items.length === 0 || checkoutBlocked || isUpdating;

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {showConfetti && (
        <div className="confetti-container">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="confetti"
              style={{
                left: piece.left,
                background: piece.background,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                transform: `rotate(${piece.rotate})`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 pt-10">
        <h1 className="text-4xl font-bold mb-10">Keranjang</h1>
      </div>

      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {cartLoading ? (
            <p className="text-gray-400">Memperbarui keranjang...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500">Keranjang kosong</p>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                busy={busyItemId === item.id}
                onDecrease={() => updateQty(item.id, (item.qty || 1) - 1)}
                onIncrease={() => updateQty(item.id, (item.qty || 1) + 1)}
                onRemove={() => removeItem(item.id)}
                onInputQty={(value) => updateQty(item.id, Number(value || 1))}
              />
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="text-xs text-purple-400 bg-purple-500/10 border border-purple-700 rounded-xl px-3 py-2">
            ✨ Preview Mode (voucher belum diterapkan)
          </div>

          <div className="rounded-2xl border border-purple-700 p-6">
            <div className="flex justify-between mb-2">
              <p className="text-sm text-gray-300">Kode Voucher</p>
              {previewLoading && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Mengecek...
                </span>
              )}
            </div>

            <input
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              placeholder="Contoh: PROMO5K"
              className="w-full rounded-xl bg-black border border-purple-700 px-3 py-2 text-sm outline-none focus:border-purple-500 transition"
            />

            {voucher.trim() && voucherValid === true && (
              <p className="text-green-400 text-xs mt-2 animate-fade-in">
                ✔ Voucher valid (preview)
              </p>
            )}

            {voucher.trim() && voucherValid === false && (
              <p className="text-red-400 text-xs mt-2 animate-fade-in">
                ✖ Voucher tidak valid
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-purple-700 p-6">
            <h3 className="text-xl font-semibold mb-6">Ringkasan</h3>

            <div className="space-y-3 text-sm">
              {discount > 0 && (
                <div className="text-xs text-gray-500 animate-fade-in">
                  <div className="flex justify-between">
                    <span>Sebelum Diskon</span>
                    <span className="line-through">
                      {formatRupiah(baseTotal)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>

              <div
                className={`flex justify-between text-green-400 discount-row ${
                  discount > 0 ? "show" : ""
                }`}
              >
                <span>Diskon</span>
                <span>- {formatRupiah(discount)}</span>
              </div>

              <div className="border-t border-purple-700 pt-4 flex justify-between text-lg font-semibold">
                <span>Total</span>

                <span
                  className={`text-purple-400 flip-number ${
                    flip ? "flip glow" : ""
                  }`}
                >
                  {formatRupiah(total)}
                </span>
              </div>

              {savedAmount > 0 && (
                <div className="saved-badge animate-fade-in">
                  💸 You saved {formatRupiah(savedAmount)}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {accessLoading && (
                <div className="text-xs text-gray-400 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2">
                  Checking checkout access...
                </div>
              )}

              {!accessLoading && !allowed && (
                <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-700 rounded-xl px-3 py-2">
                  {message || "Fitur checkout sedang maintenance."}
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutButtonDisabled}
              className="mt-6 block w-full rounded-xl bg-purple-700 py-3 font-semibold hover:bg-purple-600 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {checkoutLoading
                ? "Memproses Checkout..."
                : accessLoading
                ? "Memeriksa Akses Checkout..."
                : !allowed
                ? "Checkout Tidak Tersedia"
                : "→ Lanjut Checkout"}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.35s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .flip-number {
          display: inline-block;
          transition: transform 0.6s ease;
        }

        .flip {
          transform: rotateX(360deg);
        }

        .glow {
          filter: blur(0.3px);
          text-shadow: 0 0 12px rgba(168, 85, 247, 0.8);
        }

        .discount-row {
          opacity: 0;
          transform: translateY(-6px);
          transition: all 0.4s ease;
        }

        .discount-row.show {
          opacity: 1;
          transform: translateY(0);
          animation: bounce 0.45s ease;
        }

        @keyframes bounce {
          0% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(2px);
          }
          100% {
            transform: translateY(0);
          }
        }

        .saved-badge {
          margin-top: 8px;
          font-size: 12px;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 6px 10px;
          border-radius: 999px;
          text-align: center;
        }

        .confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 6px;
          height: 10px;
          top: -12px;
          opacity: 0.8;
          animation-name: fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </main>
  );
}