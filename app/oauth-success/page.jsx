'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Cookies from "js-cookie"

export default function OAuthSuccess() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")

    if (token) {
      Cookies.set("token", token, { path: "/", sameSite: "lax" })
      router.replace("/customer") // arahkan ke dashboard
    } else {
      router.replace("/login")
    }
  }, [params, router])

  return <p className="text-white text-center mt-10">Logging you in...</p>
}
