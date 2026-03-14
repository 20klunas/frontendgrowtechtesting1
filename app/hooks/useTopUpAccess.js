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

    const checkTopup = async () => {

      try {

        // endpoint ringan untuk check access
        await authFetch("/api/v1/wallet/summary");

        setTopupDisabled(false);
        setTopupMessage("");

      } catch (err) {

        if (isFeatureMaintenanceError(err, "topup_access")) {

          setTopupDisabled(true);

          setTopupMessage(
            getMaintenanceMessage(
              err,
              "Top up sedang maintenance."
            )
          );

          return;
        }

        if (!isMaintenanceError(err)) {
          console.error("TopUp access check failed:", err);
        }

      } finally {

        setLoading(false);

      }

    };

    checkTopup();

  }, []);

  return {
    topupDisabled,
    topupMessage,
    loading
  };
}