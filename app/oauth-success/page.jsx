'use client'

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Cookies from "js-cookie"

function OAuthHandler() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")

    if (token) {
      Cookies.set("token", token, { path: "/", sameSite: "lax" })
      router.replace("/customer")
    } else {
      router.replace("/login")
    }
  }, [params, router])

  return <p className="text-white text-center mt-10">Logging you in...</p>
}

function OAuthSuccessRedirect() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const query = params?.toString()
    router.replace(query ? `/auth/callback?${query}` : '/auth/callback')
  }, [params, router])

  return <p className="text-white text-center mt-10">Redirecting...</p>
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<p className="text-white text-center mt-10">Loading...</p>}>
      <OAuthSuccessRedirect />
    </Suspense>
  )
}
