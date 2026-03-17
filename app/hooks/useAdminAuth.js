"use client";

import { useAdminAuthContext } from "../provider/AdminAuthProvider";

export function useAdminAuth() {
  return useAdminAuthContext();
}