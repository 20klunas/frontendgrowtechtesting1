'use client'

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { useAuth } from "../../hooks/useAuth"

function OAuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("Social login gagal:", error)
      router.replace("/login?error=social_login_failed")
      return
    }

    if (!code) {
      router.replace("/login?error=no_code")
      return
    }

    const exchangeCode = async () => {
      try {
        // 1️⃣ Exchange code → token
        const res = await fetch(`${API}/api/auth/social/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ code }),
        })

        const json = await res.json()

        if (!json.success) {
          throw new Error(json.message || "Exchange code gagal")
        }

        const token = json.data.token

        // 2️⃣ Simpan token ke cookie
        Cookies.set("token", token, {
          path: "/",
          sameSite: "lax",
        })

        // 3️⃣ Ambil profile user
        const profileRes = await fetch(`${API}/api/v1/auth/me/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!profileRes.ok) {
          throw new Error("Gagal mengambil profile")
        }

        const profileJson = await profileRes.json()
        const user = profileJson.data

        // 4️⃣ Set ke AuthContext
        setUser(user)

        // 5️⃣ Redirect sesuai role
        if (user.role === "admin") {
          router.replace("/admin/dashboard")
        } else {
          router.replace("/customer")
        }

      } catch (err) {
        console.error("OAuth error:", err.message)
        Cookies.remove("token")
        router.replace("/login?error=oauth_failed")
      }
    }

    exchangeCode()

  }, [searchParams, router, setUser, API])

  return (
    <div className="flex min-h-screen items-center justify-center text-white">
      Logging you in...
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <OAuthCallbackHandler />
    </Suspense>
  )
}