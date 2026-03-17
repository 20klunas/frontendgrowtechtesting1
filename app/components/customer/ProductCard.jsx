"use client";

import Image from "next/image";
import { memo } from "react";
import { cn } from "../../lib/utils";

function ProductCard({
  product,
  userTier,
  isFav,
  favLoading,
  toggleFavorite,
  addToCart,
  handleBuyNow,
  addingId,
  checkoutLoadingId
}) {

  const pricing = Array.isArray(product.tier_pricing)
    ? product.tier_pricing[0]
    : product.tier_pricing;

  const originalPrice =
    pricing?.[userTier] ??
    pricing?.member ??
    pricing?.guest ??
    0;

  const discountPrice = product.discount_price;
  const discountPercent = product.discount_percent;

  const calculatedDiscountPrice = discountPercent
    ? originalPrice - (originalPrice * discountPercent) / 100
    : null;

  const finalPrice =
    discountPrice ??
    calculatedDiscountPrice ??
    originalPrice;

  const isDiscounted = finalPrice < originalPrice;

  const isAdding = addingId === product.id;
  const isOutOfStock = (product.available_stock ?? 0) <= 0;

  return (

    <div className="rounded-2xl border border-purple-700 bg-black overflow-hidden">

      <div className="relative h-[160px]">

        <Image
          src={product?.subcategory?.image_url || "/placeholder.png"}
          alt={product.name}
          fill
          sizes="(max-width:768px) 100vw,
                 (max-width:1200px) 50vw,
                 33vw"
          className="object-cover"
        />

        <button
          onClick={() => toggleFavorite(product.id)}
          disabled={favLoading}
          className={cn(
            "absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border",
            isFav
              ? "bg-pink-500/20 border-pink-400 text-pink-400"
              : "bg-black/40 border-white/20 text-white"
          )}
        >
          {favLoading ? "⏳" : isFav ? "♥" : "♡"}
        </button>

      </div>

      <div className="p-4">

        <h3 className="font-semibold mb-1">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-3">

          <div>

            {isDiscounted && (
              <span className="text-xs line-through text-gray-400">
                Rp {originalPrice.toLocaleString("id-ID")}
              </span>
            )}

            <div className="font-bold text-green-400">
              Rp {finalPrice.toLocaleString("id-ID")}
            </div>

          </div>

        </div>

        <div className="flex gap-2">

          <button
            onClick={() => handleBuyNow(product.id)}
            disabled={checkoutLoadingId === product.id || isOutOfStock}
            className="flex-1 bg-purple-600 rounded-lg py-2 text-sm"
          >
            Beli
          </button>

          <button
            onClick={() => addToCart(product.id)}
            disabled={isAdding || isOutOfStock}
            className="w-10 h-10 border border-purple-600 rounded-lg"
          >
            🛒
          </button>

        </div>

      </div>

    </div>

  );
}

export default memo(ProductCard);