"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="product-toolbar text-white">
            <span>Menampilkan semua produk</span>

            <input
              type="text"
              placeholder="Cari Produk"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select>
              <option>Terbaru</option>
              <option>Termurah</option>
              <option>Terlaris</option>
            </select>
          </div>

          <div className="product-grid">
            {filteredSubcategories.map((sub) => (
              <ProductCard key={sub.id} subcategory={sub} />
            ))}

            {filteredSubcategories.length === 0 && (
              <p className="text-white/60">Produk tidak ditemukan</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
