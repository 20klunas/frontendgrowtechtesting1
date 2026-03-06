"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"

const API = process.env.NEXT_PUBLIC_API_URL

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

    fetch(`${API}/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(res => {
        setAdmin(res.data)
        setPermissions(res.data.permissions || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const can = (key) => permissions.includes("*") || permissions.includes(key)

  return { admin, permissions, can, loading }
}