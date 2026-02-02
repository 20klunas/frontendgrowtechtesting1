'use client'

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { useAuth } from "@/app/hooks/useAuth"

function OAuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      router.replace("/login?error=oauth_no_token")
      return
    }

    // ✅ Simpan token ke cookie
    Cookies.set("token", token, {
      path: "/",
      sameSite: "lax",
    })

    // ✅ Ambil data user biar context terisi
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        if (!res.ok) throw new Error("Unauthorized")

        const json = await res.json()
        const user = json.data

        setUser(user)

        // Redirect sesuai role
        if (user.role === "admin") {
          router.replace("/admin/dashboard")
        } else {
          router.replace("/customer")
        }
      } catch (err) {
        console.error("OAuth fetch profile error:", err)
        Cookies.remove("token")
        router.replace("/login?error=oauth_failed")
      }
    }

    fetchProfile()
  }, [searchParams, router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Logging you in...
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <OAuthCallbackHandler />
    </Suspense>
  )
}
