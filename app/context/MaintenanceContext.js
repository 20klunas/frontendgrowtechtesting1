"use client";

import { createContext, useContext, useMemo, useState } from "react";

const MaintenanceContext = createContext(null);

export function MaintenanceProvider({ children }) {
  const [catalogDisabled, setCatalogDisabled] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const value = useMemo(
    () => ({
      catalogDisabled,
      catalogMessage,
      loading,
      setCatalogDisabled,
      setCatalogMessage,
      setLoading,
    }),
    [catalogDisabled, catalogMessage, loading]
  );

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);

  if (!context) {
    throw new Error("useMaintenance must be used within MaintenanceProvider");
  }

  return context;
}