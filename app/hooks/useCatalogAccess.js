"use client";

import { useEffect } from "react";
import { authFetch } from "../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../lib/maintenanceHandler";
import { useMaintenance } from "../context/MaintenanceContext";

export default function useCatalogAccess() {

  const {
    catalogDisabled,
    catalogMessage,
    loading,
    setCatalogDisabled,
    setCatalogMessage,
    setLoading,
  } = useMaintenance();

  useEffect(() => {

    if (!loading) return;

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
    loading,
  };
}