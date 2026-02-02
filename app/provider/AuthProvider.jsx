'use client'

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const token = Cookies.get("token")
    if (!token) {
      setLoading(false)
      return
    }

    // 💡 kalau user sudah ada (hasil login), jangan fetch lagi
    if (user !== null) {
      setLoading(false)
      return
    }

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API}/api/v1/auth/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Unauthorized")

        const json = await res.json()
        setUser(json.data)
      } catch (err) {
        Cookies.remove("token")
        setUser(null)
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [API, router])

  const logout = async () => {
    const token = Cookies.get("token")
    try {
      await fetch(`${API}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {}

    Cookies.remove("token")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

