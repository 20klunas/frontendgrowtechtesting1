"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Toast from "../../../../components/ui/Toast";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { fetcher } from "../../../../lib/fetcher";
import { useAuth } from "../../../../hooks/useAuth";
import { notifyCustomerCartChanged } from "../../../../lib/customerCartEvents";
import {
  clearCheckoutBootstrapCache,
  writeCheckoutBootstrapCache,
} from "../../../../lib/clientBootstrap";

const CHECKOUT_PAGE_PATH = "/customer/category/product/detail/lengkapipembelian";

function formatPrice(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function getProductImage(product) {
  return (
    product?.image_url ||
    product?.image ||
    product?.thumbnail_url ||
    product?.thumbnail ||
    product?.subcategory?.image_url ||
    product?.subcategory?.image ||
    "/logogrowtech.png"
  );
}

function getTieredPrice(product, tier) {
  const normalizedTier = String(tier || "member").toLowerCase();
  const tierPricing = product?.tier_pricing || {};

  const price = Number(
    tierPricing?.[normalizedTier] ??
      tierPricing?.member ??
      product?.display_price ??
      product?.price ??
      0
  ) || 0;

  return { price };
}

export default function ProductDetailClient({ productId = null, initialProduct = null }) {
  const router = useRouter();
  const { user } = useAuth();

  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(window.__gtToastTimer);
    window.__gtToastTimer = window.setTimeout(() => setToastMessage(""), 2200);
  };

  const product = initialProduct;
  const userTier = user?.tier?.toLowerCase() || "member";

  const pricing = useMemo(() => getTieredPrice(product, userTier), [product, userTier]);
  const imageSrc = getProductImage(product);
  const stockValue = Number(product?.available_stock ?? 0);
  const isOutOfStock = stockValue <= 0;
  const maxQty = Math.max(1, Math.min(99, stockValue || 1));

  const ensureAuthenticated = () => {
    if (user) return true;
    router.push("/login");
    return false;
  };

  const handleBuyNow = async () => {
    if (!product?.id || buying || adding || isOutOfStock) return;
    if (!ensureAuthenticated()) return;

    setBuying(true);

    try {
      clearCheckoutBootstrapCache();

      const checkout = await fetcher(
        "/api/v1/orders",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: product.id,
            qty: quantity,
            voucher_code: null,
          }),
        },
        { auth: true }
      );

      if (!checkout?.success) {
        throw new Error("Checkout gagal");
      }

      writeCheckoutBootstrapCache({ checkout: checkout?.data || null });
      showToast(`${product?.name || "Produk"} siap dibeli (${quantity} item)`);
      router.push(CHECKOUT_PAGE_PATH);
    } catch (error) {
      showToast(error?.message || "Gagal checkout");
    } finally {
      setBuying(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id || adding || buying || isOutOfStock) return;
    if (!ensureAuthenticated()) return;

    setAdding(true);

    try {
      const response = await fetcher(
        "/api/v1/cart/items",
        {
          method: "POST",
          body: JSON.stringify({ product_id: product.id, qty: quantity }),
        },
        { auth: true }
      );

      clearCheckoutBootstrapCache();

      if (Array.isArray(response?.data?.items)) {
        notifyCustomerCartChanged({
          type: "server-snapshot",
          items: response.data.items,
          skipServerSync: true,
        });
      } else {
        notifyCustomerCartChanged({ type: "refresh" });
      }

      showToast(`${product?.name || "Produk"} telah ditambahkan ke keranjang (${quantity} item)`);
      router.push("/customer/category/product/detail/cart");
    } catch (error) {
      const serverItems = error?.data?.error?.details?.items;
      const serverSummary = error?.data?.error?.details?.summary;

      if (Array.isArray(serverItems)) {
        notifyCustomerCartChanged({
          type: "server-snapshot",
          items: serverItems,
          summary: serverSummary,
          skipServerSync: true,
        });
      } else {
        notifyCustomerCartChanged({ type: "refresh" });
      }

      showToast(error?.data?.error?.message || error?.message || "Gagal menambahkan ke keranjang");
    } finally {
      setAdding(false);
    }
  };

  if (!productId || !product) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10 text-white">
        <div className="rounded-2xl border border-purple-800 bg-gradient-to-b from-purple-950/40 to-black p-8 text-center">
          <h1 className="text-2xl font-bold">Produk tidak ditemukan</h1>
          <p className="mt-3 text-sm text-gray-400">
            Route produk populer sudah diarahkan ke detail produk, tetapi data produk ini tidak tersedia.
          </p>
          <Link
            href="/customer/category"
            className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500"
          >
            Kembali ke katalog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 text-white">
      <div className="mb-6 overflow-hidden rounded-2xl border border-purple-800 bg-black">
        <div className="relative h-[260px] w-full sm:h-[320px]">
          <Image
            src={imageSrc}
            alt={product?.name || "Produk"}
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-1 text-sm text-purple-400">
          {product?.category?.name || "Kategori"}
          {product?.subcategory?.name ? ` • ${product.subcategory.name}` : ""}
        </p>
        <h1 className="text-3xl font-bold">{product?.name || "Produk"}</h1>
      </div>

      <div className="mb-6 rounded-2xl border border-purple-800 bg-gradient-to-b from-purple-900/40 to-black p-6">
        <p className="mb-1 text-sm text-gray-300">Harga {user?.tier || "Member"}</p>
        <p className="text-4xl font-bold">{formatPrice(pricing.price)}</p>
        {/* {pricing.profit > 0 ? (
          <p className="mt-2 text-sm text-green-400">+ profit {formatPrice(pricing.profit).replace("Rp ", "")}</p>
        ) : null} */}
      </div>

      <div className="mb-6 rounded-2xl border border-purple-800 bg-black p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-300">Jumlah pembelian</p>
            <p className="text-xs text-gray-500">Pilih langsung jumlah item sebelum masuk cart atau checkout.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="h-9 w-9 rounded-lg bg-purple-700/40 text-lg hover:bg-purple-600 disabled:opacity-40"
              disabled={adding || buying || quantity <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => {
                const next = Number(e.target.value || 1);
                setQuantity(Math.max(1, Math.min(maxQty, next || 1)));
              }}
              className="w-20 rounded-lg border border-purple-700 bg-black px-3 py-2 text-center"
            />
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.min(maxQty, prev + 1))}
              className="h-9 w-9 rounded-lg bg-purple-700/40 text-lg hover:bg-purple-600 disabled:opacity-40"
              disabled={adding || buying || quantity >= maxQty}
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Stok Tersedia</span>
          <span>{stockValue}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full rounded-full ${isOutOfStock ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${Math.min(100, Math.max(8, stockValue > 0 ? 85 : 8))}%` }}
          />
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-purple-800 bg-black p-6">
        <h2 className="mb-3 text-lg font-semibold">Deskripsi</h2>
        <p className="whitespace-pre-line text-sm leading-7 text-gray-300">
          {product?.description || product?.subcategory?.description || "Belum ada deskripsi produk."}
        </p>
      </div>

      <div className="mb-10 space-y-4">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buying || adding || isOutOfStock}
          className="block w-full rounded-xl bg-white py-4 text-center text-lg font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buying ? "Memproses..." : "Beli Sekarang"}
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || buying || isOutOfStock}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-800 py-4 text-lg font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart className="h-5 w-5" />
          {adding ? "Menambahkan..." : "Masukkan Ke Keranjang"}
        </button>
      </div>
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </section>
  );
}
