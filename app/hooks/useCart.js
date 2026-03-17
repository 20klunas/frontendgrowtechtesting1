"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "../lib/authFetch";
import useCheckoutAccess from "./useCheckoutAccess";

export default function useCartPage(router) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [voucher, setVoucher] = useState("");
  const [voucherValid, setVoucherValid] = useState(null);

  const { loading: accessLoading, allowed, message } = useCheckoutAccess();

  const debounceRef = useRef(null);

  // animation
  const [flip, setFlip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ================= FETCH CART =================
  const fetchCart = async () => {
    try {
      const json = await authFetch("/api/v1/cart");

      setItems(json.data.items || []);
      setSummary(json.data.summary || null);
      setPreviewSummary(json.data.summary || null);

      setUnauthorized(false);
    } catch (err) {
      if (err.message.includes("Unauthorized")) {
        setUnauthorized(true);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ================= PREVIEW =================
  const previewVoucher = async (code) => {
    try {
      setPreviewLoading(true);

      const query = code ? `?voucher_code=${code}` : "";
      const json = await authFetch(`/api/v1/cart/checkout${query}`);

      if (json.success) {
        setVoucherValid(true);
        setPreviewSummary(json.data.summary);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1200);
      } else {
        setVoucherValid(false);
      }
    } catch {
      setVoucherValid(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const triggerPreview = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      previewVoucher(voucher);
    }, 400);
  };

  useEffect(() => {
    triggerPreview();
    return () => clearTimeout(debounceRef.current);
  }, [voucher]);

  // ================= ACTION =================
  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

      await authFetch("/api/v1/cart/checkout", {
        method: "POST",
        body: JSON.stringify({
          voucher_code: voucher || null,
        }),
      });

      router.push("/customer/category/product/detail/lengkapipembelian");
    } catch (err) {
      alert(err.message || "Checkout gagal");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const updateQty = async (id, qty) => {
    if (qty < 1) return;

    try {
      const json = await authFetch(`/api/v1/cart/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ qty }),
      });

      if (json.success) {
        fetchCart();
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      alert(err.message || "Gagal update qty");
    }
  };

  const removeItem = async (id) => {
    try {
      const json = await authFetch(`/api/v1/cart/items/${id}`, {
        method: "DELETE",
      });

      if (json.success) {
        fetchCart();
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      alert(err.message || "Gagal hapus item");
    }
  };

  // ================= CALC =================
  const baseSubtotal = summary?.subtotal ?? 0;
  const baseTotal = summary?.total ?? baseSubtotal;

  const subtotal = previewSummary?.subtotal ?? 0;
  const discount = previewSummary?.discount_total ?? 0;
  const total = previewSummary?.total ?? subtotal;

  const savedAmount = Math.max(baseTotal - total, 0);

  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (prevTotalRef.current !== total) {
      setFlip(true);
      setTimeout(() => setFlip(false), 650);
      prevTotalRef.current = total;
    }
  }, [total]);

  return {
    items,
    loading,
    unauthorized,
    accessLoading,
    allowed,
    message,

    voucher,
    setVoucher,
    voucherValid,
    previewLoading,

    checkoutLoading,

    subtotal,
    discount,
    total,
    savedAmount,
    baseTotal,

    flip,
    showConfetti,

    updateQty,
    removeItem,
    handleCheckout,
  };
}