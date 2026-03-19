"use client";

import { useAdminAuth } from "./useAdminAuth";

export function usePermission() {
  const {
    permissions,
    admin,
    loading,
    can,
    hasAdminFlag,
    refreshAdminAuth,
  } = useAdminAuth();

  return {
    can,
    hasAdminFlag,
    permissions,
    admin,
    loading,
    refreshAdminAuth,
  };
}