"use client"

import { useAdminAuth } from "../providers/AdminAuthProvider"

export function usePermission() {
  const { permissions, admin, loading, can } = useAdminAuth()

  return { can, permissions, admin, loading }
}