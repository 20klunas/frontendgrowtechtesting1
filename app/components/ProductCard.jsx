"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProductCard({ subcategory }) {
  const router = useRouter();

  const handleViewProducts = () => {
    router.push(`/products?subcategory=${subcategory.id}`);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <Image
          src={subcategory.image_url}
          alt={subcategory.name}
          width={300}
          height={200}
          className="rounded-xl"
        />
      </div>

      <div className="product-info">
        <h3>{subcategory.name}</h3>
        <p>{subcategory.provider}</p>

        <button onClick={handleViewProducts}>
          Lihat Produk
        </button>
      </div>
    </div>
  );
}
