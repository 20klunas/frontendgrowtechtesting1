"use client";

import { useEffect, useState } from "react";
import { publicFetch } from "../lib/publicFetch";

export default function useCheckoutAccess() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        const res = await publicFetch("/api/v1/content/settings?group=system");

        const settings = {};
        (res?.data || []).forEach((item) => {
          settings[item.key] = item.value;
        });

        const checkout = settings.checkout_access || {
          enabled: true,
          message: "",
        };

        if (!active) return;

        setAllowed(Boolean(checkout.enabled));
        setMessage(checkout.message || "");
      } catch (err) {
        if (!active) return;

        console.error("Checkout access check failed:", err);
        setAllowed(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  return { loading, allowed, message };
}