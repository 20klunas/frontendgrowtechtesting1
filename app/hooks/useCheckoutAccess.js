"use client"

import { useMaintenance } from "../context/MaintenanceContext"

export default function useCheckoutAccess() {
  const {
    checkoutDisabled,
    checkoutMessage,
    loading,
    refreshMaintenance,
  } = useMaintenance()

  return {
    loading,
    allowed: !checkoutDisabled,
    message: checkoutMessage,
    refreshMaintenance,
  }
}