"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

function buildUrl(path) {
  if (API.endsWith("/api/v1")) {
    return `${API}${path}`
  }
  return `${API}/api/v1${path}`
}

export function useAdminAuth() {
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
          throw new Error(json?.error?.message || "Gagal mengambil admin me")
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

  const can = (key) => permissions.includes("*") || permissions.includes(key)

  return { admin, permissions, can, loading }
}