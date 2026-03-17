"use client";

import { useAdminAuth } from "./useAdminAuth";

export function usePermission() {
  const { permissions, admin, loading, can, refreshAdminAuth } = useAdminAuth();

  return {
    can,
    permissions,
    admin,
    loading,
    refreshAdminAuth,
  };
}