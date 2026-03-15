"use client"

import { usePermission } from "../../hooks/usePermission"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PermissionGate({ permission, children }) {
  const { can, loading } = usePermission()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !can(permission)) {
      router.replace("/admin/not-found")
    }
  }, [loading, permission, can])

  if (loading) {
    return null
  }

  if (!can(permission)) return null

  return children
}