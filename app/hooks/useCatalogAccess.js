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
    let active = true;

    const checkCatalog = async () => {
      try {
        await authFetch("/api/v1/catalog/products?per_page=1");

        if (!active) return;

        setCatalogDisabled(false);
        setCatalogMessage("");
      } catch (err) {
        if (!active) return;

        if (isFeatureMaintenanceError(err, "catalog_access")) {
          setCatalogDisabled(true);
          setCatalogMessage(
            getMaintenanceMessage(err, "Katalog sedang maintenance.")
          );
          return;
        }

        if (!isMaintenanceError(err)) {
          console.error("Catalog check failed:", err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (loading) {
      checkCatalog();
    }

    return () => {
      active = false;
    };
  }, [loading, setCatalogDisabled, setCatalogMessage, setLoading]);

  return {
    catalogDisabled,
    catalogMessage,
    loading,
  };
}