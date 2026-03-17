"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "../lib/authFetch";

export default function useVoucher(summary, setShowConfetti) {
  const [voucher, setVoucher] = useState("");
  const [previewSummary, setPreviewSummary] = useState(summary);
  const [voucherValid, setVoucherValid] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const debounceRef = useRef(null);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      previewVoucher(voucher);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [voucher]);

  return {
    voucher,
    setVoucher,
    previewSummary,
    voucherValid,
    previewLoading,
  };
}