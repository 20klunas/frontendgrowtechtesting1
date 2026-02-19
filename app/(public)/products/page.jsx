"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subcategoryId = searchParams.get("subcategory");

  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (subcategoryId) {
      fetchProducts();
    }
  }, [subcategoryId]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${API}/products?subcategory_id=${subcategoryId}`
      );
      const json = await res.json();

      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Failed fetch products:", err);
    }
  };

  const handleBuy = () => {
    router.push("/login");
  };

  return (
    <main className="product-wrapper">
      <h1 className="product-title">Daftar Produk</h1>

      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Durasi: {product.duration_days} hari</p>

            <button onClick={handleBuy}>
              Beli Sekarang
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
