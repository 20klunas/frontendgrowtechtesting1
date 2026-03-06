"use client"

import { useAdminAuth } from "./useAdminAuth"

export function usePermission() {
  const { permissions, loading } = useAdminAuth()

  const can = (key) => {
    if (!permissions) return false
    return permissions.includes("*") || permissions.includes(key)
  }

  return { can, loading }
}