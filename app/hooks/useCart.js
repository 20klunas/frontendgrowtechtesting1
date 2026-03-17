"use client";

import { useState } from "react";
import { authFetch } from "../lib/authFetch";

export default function useCart(initialCart) {
  const [items, setItems] = useState(initialCart?.data?.items || []);
  const [summary, setSummary] = useState(initialCart?.data?.summary || null);
  const [loading, setLoading] = useState(!initialCart);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchCart = async () => {
    try {
      const json = await authFetch("/api/v1/cart");

      setItems(json.data.items || []);
      setSummary(json.data.summary || null);

      setUnauthorized(false);
    } catch (err) {
      console.error("Fetch cart error:", err.message);

      if (err.message.includes("Unauthorized")) {
        setUnauthorized(true);
      }

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;

    try {
      const json = await authFetch(`/api/v1/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ qty: newQty }),
      });

      if (json.success) {
        await fetchCart();
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Update qty error:", err.message);
      alert(err.message || "Gagal update qty");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const json = await authFetch(`/api/v1/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (json.success) {
        await fetchCart();
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Remove item error:", err.message);
      alert(err.message || "Gagal hapus item");
    }
  };

  return {
    items,
    summary,
    loading,
    unauthorized,
    fetchCart,
    updateQty,
    removeItem,
  };
}