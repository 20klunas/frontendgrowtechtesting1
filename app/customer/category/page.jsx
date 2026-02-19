"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/SubCategoryCard";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      const json = await res.json();

      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Failed fetch categories:", err);
    }
  };

  const fetchSubcategories = async (categoryId = null) => {
    try {
      setLoading(true);

      const url = categoryId
        ? `${API}/api/v1/categories/${categoryId}/subcategories`
        : `${API}/api/v1/subcategories`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setSubcategories(json.data);
      }
    } catch (err) {
      console.error("Failed fetch subcategories:", err);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchSubcategories(categoryId);
  };

  return (
    <main className="product-wrapper">
      <h1 className="product-title">Produk</h1>

      <div className="product-layout">
        {/* SIDEBAR */}
        <aside className="product-sidebar">
          <h4>Kategori</h4>

          <button
            className={!selectedCategory ? "active" : ""}
            onClick={() => handleCategoryClick(null)}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              className={selectedCategory === cat.id ? "active" : ""}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <section className="product-content">
          {/* TOOLBAR */}
          <div className="product-toolbar text-white">
            <span>
              {selectedCategory
                ? "Menampilkan produk kategori"
                : "Menampilkan semua produk"}
            </span>

            <input
              type="text"
              placeholder="Cari Produk"
            />

            <select>
              <option>Terbaru</option>
              <option>Termurah</option>
              <option>Terlaris</option>
            </select>
          </div>

          {/* GRID */}
          <div className="product-grid">
            {loading ? (
              <>
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
              </>
            ) : subcategories.length === 0 ? (
              <div className="col-span-full text-center py-20 text-zinc-500">
                <p className="text-lg">Tidak ada subkategori</p>
                <p className="text-sm">
                  Data belum tersedia
                </p>
              </div>
            ) : (
              subcategories.map((sub) => (
                <ProductCard
                  key={sub.id}
                  subcategory={sub}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
