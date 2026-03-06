"use client"

import { usePermission } from "@/hooks/usePermission"

export default function PermissionGate({ permission, children }) {
  const { can, loading } = usePermission()

  if (loading) return null
  if (!can(permission)) return null

  return children
}