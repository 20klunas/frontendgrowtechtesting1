"use client"

import { usePermission } from "../../hooks/usePermission"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PermissionGate({ permission, children }) {
  const { can, loading } = usePermission()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !can(permission)) {
      router.replace("admin/404")
    }
  }, [loading])

  if (loading) return null

  return children
}