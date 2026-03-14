"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../lib/maintenanceHandler";

export default function useTopUpAccess() {
  const [topupDisabled, setTopupDisabled] = useState(false);
  const [topupMessage, setTopupMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkTopup = async () => {
      try {
        await authFetch("/api/v1/wallet/topups/init", {
          method: "POST",
          body: JSON.stringify({ amount: 1000, gateway_code: "test" })
        });

        if (!active) return;

        setTopupDisabled(false);
        setTopupMessage("");
      } catch (err) {
        if (!active) return;

        if (isFeatureMaintenanceError(err, "topup_access")) {
          setTopupDisabled(true);
          setTopupMessage(
            getMaintenanceMessage(err, "Top up sedang maintenance.")
          );
          return;
        }

        if (!isMaintenanceError(err)) {
          console.error("TopUp access check failed:", err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkTopup();

    return () => {
      active = false;
    };
  }, []);

  return {
    topupDisabled,
    topupMessage,
    loading,
  };
}