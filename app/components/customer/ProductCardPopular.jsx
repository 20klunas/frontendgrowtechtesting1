import Link from "next/link";
import { Star } from "lucide-react";

function resolveProductHref(product) {
  const productId = product?.id;
  if (productId) {
    return `/customer/category/product/detail?id=${encodeURIComponent(String(productId))}`;
  }

  const subcategoryId = product?.subcategory_id ?? product?.subcategory?.id ?? null;
  if (subcategoryId) {
    return `/customer/category/product?subcategory_id=${encodeURIComponent(String(subcategoryId))}`;
  }

  return "/customer/category";
}

function resolveProductImage(product) {
  return (
    product?.subcategory?.image_url ||
    product?.image_url ||
    "/logogrowtech.png"
  );
}

function resolveProductPricing(product) {
  const basePricing = product?.tier_pricing || {};

  const final = Number(
    basePricing?.member ??
      product?.display_price_breakdown?.base_price ??
      product?.display_price ??
      product?.price ??
      0
  ) || 0;

  return { final };
}

function renderStars(rating = 0) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return Array.from({ length: 5 }).map((_, i) => {
    const fillPercent = Math.min(Math.max(safeRating - i, 0), 1) * 100;

    return (
      <div key={i} className="relative w-4 h-4">
        <Star className="absolute text-white/30 w-4 h-4" />
        <div
          className="absolute overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          <Star className="text-yellow-400 fill-yellow-400 w-4 h-4 drop-shadow-[0_0_2px_rgba(250,204,21,0.8)]" />
        </div>
      </div>
    );
  });
}

export default function ProductCardPopular({ product }) {
  if (!product) return null;

  const href = resolveProductHref(product);
  const imageSrc = resolveProductImage(product);
  const pricing = resolveProductPricing(product);
  const stock = Number(product?.available_stock ?? 0);
  const productName = product?.name || "Produk";

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black overflow-hidden transition hover:border-purple-500 hover:shadow-xl hover:shadow-purple-900/30"
    >
      <div className="relative h-[180px] bg-white overflow-hidden">
        <img
          src={imageSrc}
          alt={productName}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-1">
          {productName}
        </h3>

        <p className="text-xs text-gray-400 mb-2">
          Stok {Number.isFinite(stock) ? stock : 0}
        </p>

        <div className="flex items-center gap-1 mb-2">
          {renderStars(product?.rating)}

          <span className="text-xs text-gray-400 ml-1">
            {Number(product?.rating || 0).toFixed(1)}
          </span>

          <span className="text-xs text-gray-500">
            ({product?.rating_count || 0})
          </span>
        </div>

        <p className="font-bold text-green-400">
          Rp {pricing.final.toLocaleString("id-ID")}
        </p>
      </div>
    </Link>
  );
}
