"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiFetch";

export default function useCheckoutAccess() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await apiFetch(
          "/api/v1/public/settings?group=system"
        );

        const settings = {};
        res.data.forEach((item) => {
          settings[item.key] = item.value;
        });

        const checkout = settings.checkout_access || {
          enabled: true,
          message: "",
        };

        setAllowed(checkout.enabled);
        setMessage(checkout.message || "");
      } catch (err) {
        console.error("Checkout access check failed:", err);
        setAllowed(true);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { loading, allowed, message };
}