import Link from "next/link";

function resolveProductHref(product) {
  const idOrSlug = product?.slug ?? product?.id ?? "";
  return `/customer/category/product/${encodeURIComponent(String(idOrSlug))}`;
}

function resolveProductImage(product) {
  return (
    product?.subcategory?.image_url ||
    product?.image_url ||
    "/placeholder.png"
  );
}

function resolveProductPrice(product) {
  const raw =
    product?.tier_pricing?.member ??
    product?.tier_pricing?.guest ??
    product?.price ??
    0;

  return Number(raw) || 0;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}

export default function ProductCardPopular({ product }) {
  if (!product) return null;

  const href = resolveProductHref(product);
  const imageSrc = resolveProductImage(product);
  const price = resolveProductPrice(product);
  const stock = Number(product?.available_stock ?? 0);
  const productName = product?.name || "Produk";
  const ratingStars = renderStars(product?.rating);

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

        <div className="text-yellow-400 text-sm mb-2">{ratingStars}</div>

        <p className="font-bold text-green-400">
          Rp {price.toLocaleString("id-ID")}
        </p>
      </div>
    </Link>
  );
}