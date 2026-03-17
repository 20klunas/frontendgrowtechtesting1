"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "../../hooks/usePermission";

export default function PermissionGate({ permission, children }) {
  const { can, loading } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !can(permission)) {
      router.replace("/admin/not-found");
    }
  }, [loading, permission, can, router]);

  if (loading) {
    return null;
  }

  if (!can(permission)) {
    return null;
  }

  return children;
}