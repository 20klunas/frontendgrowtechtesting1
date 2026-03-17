"use client";

import { useMaintenance } from "../context/MaintenanceContext";

export default function useTopUpAccess() {
  const {
    topupDisabled,
    topupMessage,
    loading,
    refreshMaintenance,
  } = useMaintenance();

  return {
    topupDisabled,
    topupMessage,
    loading,
    refreshMaintenance,
  };
}