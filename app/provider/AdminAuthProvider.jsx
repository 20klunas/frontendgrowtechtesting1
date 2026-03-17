"use client"

import { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"

const AdminAuthContext = createContext()

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

function buildUrl(path) {
  if (API.endsWith("/api/v1")) {
    return `${API}${path}`
  }
  return `${API}/api/v1${path}`
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get("token")

    if (!token) {
      setLoading(false)
      return
    }

    fetch(buildUrl("/admin/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message || "Gagal mengambil admin")
        }
        return json
      })
      .then((json) => {
        setAdmin(json.data || null)
        setPermissions(json.data?.permissions || [])
      })
      .catch(() => {
        setAdmin(null)
        setPermissions([])
      })
      .finally(() => setLoading(false))
  }, [])

  const can = (key) => {
    if (!key) return true
    return permissions.includes("*") || permissions.includes(key)
  }

  return (
    <AdminAuthContext.Provider
      value={{ admin, permissions, loading, can }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}