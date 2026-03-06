"use client"

import { useAdminAuth } from "./useAdminAuth"

export function usePermission() {
  const { permissions, admin, loading } = useAdminAuth()

  const can = (key) => {
    if (!key) return true
    if (!permissions) return false
    return permissions.includes("*") || permissions.includes(key)
  }

  return { can, permissions, admin, loading }
}