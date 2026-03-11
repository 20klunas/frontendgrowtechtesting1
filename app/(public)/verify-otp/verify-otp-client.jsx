'use client'

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { useAuth } from "../../hooks/useAuth"

export default function VerifyOtpClient() {

  const router = useRouter()
  const params = useSearchParams()

  const challengeId = params.get("challenge_id")

  const { setUser } = useAuth()

  const API = process.env.NEXT_PUBLIC_API_URL

  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {

      const res = await fetch(`${API}/api/v1/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          code
        })
      })

      const json = await res.json()

      if (!json.success) {
        throw new Error(json.message || "OTP salah")
      }

      const token = json.data.token

      Cookies.set("token", token, {
        path: "/",
        sameSite: "lax"
      })

      const profileRes = await fetch(`${API}/api/v1/auth/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const profileJson = await profileRes.json()

      const user = profileJson.data

      setUser(user)

      if (user.role === "admin") {
        router.replace("/admin/dashboard")
      } else {
        router.replace("/customer")
      }

    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center text-white">

      <form
        onSubmit={handleVerify}
        className="bg-black border border-purple-500 p-8 rounded-xl w-96"
      >

        <h1 className="text-xl mb-4 text-center">Verify OTP</h1>

        <input
          type="text"
          placeholder="Masukkan OTP"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 rounded bg-black border border-purple-400 mb-4"
        />

        <button
          disabled={loading}
          className="w-full bg-purple-600 p-3 rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </form>

    </main>
  )
}