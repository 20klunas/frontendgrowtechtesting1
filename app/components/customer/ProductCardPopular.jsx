import { memo } from "react";
import Image from "next/image";
import Link from "next/link";

const ProductCard = memo(function ProductCard({ product }) {
  const price =
    product?.tier_pricing?.member ??
    product?.tier_pricing?.guest ??
    0;

  return (
    <Link
      href={`/customer/category/product/${product.id}`}
      className="group block rounded-2xl border border-purple-800/40 bg-gradient-to-b from-zinc-900 to-black overflow-hidden transition hover:border-purple-500 hover:shadow-xl hover:shadow-purple-900/30"
    >
      <div className="relative h-[180px] bg-white overflow-hidden">
        <Image
          src={product?.subcategory?.image_url || "/placeholder.png"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover group-hover:scale-105 transition duration-300"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-1">
          {product.name}
        </h3>

        <p className="text-xs text-gray-400 mb-2">
          Stok {product.available_stock ?? 0}
        </p>

        <div className="text-yellow-400 text-sm mb-2">
          {"★".repeat(Math.round(product.rating || 0))}
          {"☆".repeat(5 - Math.round(product.rating || 0))}
        </div>

        <p className="font-bold text-green-400">
          Rp {price.toLocaleString("id-ID")}
        </p>
      </div>
    </Link>
  );
});

export default ProductCard;