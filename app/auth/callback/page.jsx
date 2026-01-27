'use client'

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { useAuth } from "../../../app/hooks/useAuth"

function OAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) return

    Cookies.set("token", token, {
      path: "/",
      sameSite: "lax",
    })

    const fetchMe = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!res.ok) throw new Error("Invalid token")

        const json = await res.json()
        const user = json.data

        setUser(user)

        if (user.role === "admin") {
          router.replace("/admin/dashboard")
        } else {
          router.replace("/customer")
        }
      } catch (err) {
        console.error("OAuth callback error:", err)
        Cookies.remove("token")
        router.replace("/login?error=oauth_failed")
      }
    }

    fetchMe()
  }, [searchParams, router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Logging you in...
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <OAuthCallbackContent />
    </Suspense>
  )
}
