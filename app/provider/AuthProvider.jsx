'use client'

import { createContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const token = Cookies.get("token")

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    // ✅ jika user sudah ada, tidak perlu fetch lagi
    if (user) {
      setLoading(false)
      return
    }

    const fetchMe = async () => {

      try {

        const res = await fetch(`${API}/api/v1/auth/me/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          throw new Error("Unauthorized")
        }

        const json = await res.json()
        setUser(json.data)

      } catch (err) {

        console.error("Auth fetch error:", err)

        Cookies.remove("token")
        setUser(null)

      } finally {

        setLoading(false)

      }

    }

    fetchMe()

  }, [user])

  const logout = async () => {
    const token = Cookies.get("token")

    try {
      await fetch(`${API}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (err) {
      console.error("Logout error:", err)
    }

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