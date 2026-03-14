"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../lib/maintenanceHandler";

export default function useCatalogAccess() {

  const [catalogDisabled, setCatalogDisabled] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const checkCatalog = async () => {

      try {

        await authFetch("/api/v1/catalog/products?per_page=1");

        setCatalogDisabled(false);
        setCatalogMessage("");

      } catch (err) {

        if (isFeatureMaintenanceError(err, "catalog_access")) {

          setCatalogDisabled(true);

          setCatalogMessage(
            getMaintenanceMessage(
              err,
              "Katalog sedang maintenance."
            )
          );

          return;
        }

        if (!isMaintenanceError(err)) {
          console.error("Catalog check failed:", err);
        }

      } finally {

        setLoading(false);

      }

    };

    checkCatalog();

  }, []);

  return {
    catalogDisabled,
    catalogMessage,
    loading
  };
}