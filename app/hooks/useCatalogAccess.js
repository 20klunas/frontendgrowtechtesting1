"use client";

import { useMaintenance } from "../context/MaintenanceContext";

export default function useCatalogAccess() {
  const {
    catalogDisabled,
    catalogMessage,
    loading,
    refreshMaintenance,
  } = useMaintenance();

  return {
    catalogDisabled,
    catalogMessage,
    loading,
    refreshMaintenance,
  };
}