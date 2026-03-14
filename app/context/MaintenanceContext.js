"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authFetch } from "../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
  isMaintenanceError,
} from "../lib/maintenanceHandler";

const MaintenanceContext = createContext();

export function MaintenanceProvider({ children }) {
  const [catalogDisabled, setCatalogDisabled] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        await authFetch("/api/v1/catalog/products?per_page=1");

        setCatalogDisabled(false);
        setCatalogMessage("");
      } catch (err) {
        if (isFeatureMaintenanceError(err, "catalog_access")) {
          setCatalogDisabled(true);
          setCatalogMessage(
            getMaintenanceMessage(err, "Katalog sedang maintenance.")
          );
          return;
        }

        if (!isMaintenanceError(err)) {
          console.error("Maintenance check error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  return (
    <MaintenanceContext.Provider
      value={{
        catalogDisabled,
        catalogMessage,
        loading,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}