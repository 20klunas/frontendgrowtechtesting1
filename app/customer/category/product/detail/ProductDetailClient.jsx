"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
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
    "/placeholder.png"
  );
}

function getTieredPrice(product, tier) {
  const normalizedTier = String(tier || "member").toLowerCase();
  const tierPricing = product?.tier_pricing || {};
  const tierProfit = product?.tier_profit || {};
  const tierFinalPricing = product?.tier_final_pricing || {};

  const base = Number(
    tierPricing?.[normalizedTier] ??
      tierPricing?.member ??
      product?.display_price_breakdown?.base_price ??
      product?.price ??
      0
  ) || 0;

  const profit = Number(
    tierProfit?.[normalizedTier] ??
      tierProfit?.member ??
      product?.display_price_breakdown?.profit ??
      0
  ) || 0;

  const final = Number(
    tierFinalPricing?.[normalizedTier] ??
      tierFinalPricing?.member ??
      product?.display_price ??
      base + profit
  ) || 0;

  return { base, profit, final };
}

export default function ProductDetailClient({ productId = null, initialProduct = null }) {
  const router = useRouter();
  const { user } = useAuth();

  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const product = initialProduct;
  const userTier = user?.tier?.toLowerCase() || "member";

  const pricing = useMemo(() => getTieredPrice(product, userTier), [product, userTier]);
  const imageSrc = getProductImage(product);
  const stockValue = Number(product?.available_stock ?? 0);
  const isOutOfStock = stockValue <= 0;

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
            qty: 1,
            voucher_code: null,
          }),
        },
        { auth: true }
      );

      if (!checkout?.success) {
        throw new Error("Checkout gagal");
      }

      writeCheckoutBootstrapCache({ checkout: checkout?.data || null });
      router.push(CHECKOUT_PAGE_PATH);
    } catch (error) {
      alert(error?.message || "Gagal checkout");
    } finally {
      setBuying(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id || adding || buying || isOutOfStock) return;
    if (!ensureAuthenticated()) return;

    setAdding(true);

    try {
      await fetcher(
        "/api/v1/cart/items",
        {
          method: "POST",
          body: JSON.stringify({ product_id: product.id, qty: 1 }),
        },
        { auth: true }
      );

      clearCheckoutBootstrapCache();
      notifyCustomerCartChanged();
      router.push("/customer/category/product/detail/cart");
    } catch (error) {
      alert(error?.message || "Gagal menambahkan ke keranjang");
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
        <p className="text-4xl font-bold">{formatPrice(pricing.final)}</p>
        {pricing.profit > 0 ? (
          <p className="mt-2 text-sm text-green-400">+ profit {formatPrice(pricing.profit).replace("Rp ", "")}</p>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-purple-800 bg-black p-6">
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
    </section>
  );
}
