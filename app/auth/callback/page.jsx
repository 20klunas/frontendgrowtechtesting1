'use client'

import { useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { publicFetch } from "../../lib/publicFetch"
import { persistAuthSession, resolvePostLoginPath } from "../../lib/authSession"
import {
  clearTrustedDevicePreference,
  getTrustedDevicePreference,
  saveTrustedDeviceCredential,
} from "../../lib/trustedDevicePreference"

function OAuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, refreshUser } = useAuth()
  const executed = useRef(false)

  useEffect(() => {
    if (executed.current) return
    executed.current = true

    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("Social login gagal:", error)
      clearTrustedDevicePreference()
      router.replace("/login?error=social_login_failed")
      return
    }

    if (!code) {
      clearTrustedDevicePreference()
      router.replace("/login?error=no_code")
      return
    }

    const exchangeCode = async () => {
      try {
        const remember = getTrustedDevicePreference(true)
        const json = await publicFetch("/api/v1/auth/social/exchange", {
          method: "POST",
          body: JSON.stringify({ code, remember }),
        })

        if (json?.data?.trusted_device_credential) {
          saveTrustedDeviceCredential(
            json.data.trusted_device_credential,
            json?.data?.trusted_device_expires_at || null
          )
        }

        if (json?.data?.requires_2fa) {
          clearTrustedDevicePreference()
          router.replace(`/verify-otp?challenge_id=${json.data.challenge_id}`)
          return
        }

        const token = json?.data?.token
        const authUser = json?.data?.user

        if (!token || !authUser) {
          throw new Error("Login sosial gagal diproses")
        }

        const targetPath = resolvePostLoginPath(authUser)
        persistAuthSession(token, authUser)
        setUser(authUser, { display: true })
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:login"))
        }
        refreshUser?.().catch(() => {})
        clearTrustedDevicePreference()
        router.replace(targetPath)
      } catch (err) {
        console.error("OAuth error:", err.message)
        clearTrustedDevicePreference()
        router.replace("/login?error=oauth_failed")
      }
    }

    exchangeCode()
  }, [refreshUser, router, searchParams, setUser])

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
