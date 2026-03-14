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

  return (
    <MaintenanceContext.Provider
      value={{
        catalogDisabled,
        catalogMessage,
        loading,
        setCatalogDisabled,
        setCatalogMessage,
        setLoading
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}