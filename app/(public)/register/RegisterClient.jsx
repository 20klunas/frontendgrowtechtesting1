"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { publicFetch } from "../../lib/publicFetch"
import {
  getTrustedDevicePreference,
  setTrustedDevicePreference,
} from "../../lib/trustedDevicePreference"

export default function RegisterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const API = process.env.NEXT_PUBLIC_API_URL

  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    name: "",
    remember: true,
    referral_code: "",
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ref = String(searchParams.get("ref") || "").trim().toUpperCase()
    setForm((prev) => ({
      ...prev,
      remember: getTrustedDevicePreference(true),
      referral_code: ref || prev.referral_code || "",
    }))
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (form.password !== form.password_confirmation) {
      alert("Password dan konfirmasi tidak sama")
      setLoading(false)
      return
    }

    try {
      setTrustedDevicePreference(form.remember)

      const json = await publicFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      })

      if (json?.data?.requires_2fa) {
        router.push(`/verify-otp?challenge_id=${json.data.challenge_id}`)
        return
      }
    } catch (err) {
      if (!err?.isMaintenance) {
        alert(err?.message || "Register gagal")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    if (!API) {
      alert("NEXT_PUBLIC_API_URL belum diset")
      return
    }

    setTrustedDevicePreference(form.remember)
    window.location.href = `${API}/api/v1/auth/google/redirect`
  }

  const handleDiscordRegister = () => {
    if (!API) {
      alert("NEXT_PUBLIC_API_URL belum diset")
      return
    }

    setTrustedDevicePreference(form.remember)
    window.location.href = `${API}/api/v1/auth/discord/redirect`
  }

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md rounded-2xl border border-purple-400/60 bg-black p-8 text-white">
        <div className="flex justify-center mb-5">
          <Image src="/logoherosection.png" alt="Growtech" width={90} height={90} />
        </div>

        <h1 className="text-center text-2xl font-semibold text-purple-300 mb-6">Register</h1>

        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="text-sm text-purple-300">Nama</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Kode Referral (opsional)</label>
            <input
              type="text"
              name="referral_code"
              value={form.referral_code}
              onChange={handleChange}
              placeholder="Masukkan kode referral"
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Konfirmasi Password</label>
            <input
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-purple-400/20 bg-purple-950/20 px-4 py-3 text-sm text-gray-200">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-purple-400/50 bg-transparent text-purple-500 focus:ring-purple-500"
            />
            <span>Ingat perangkat ini untuk lewati OTP hingga 30 hari</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-[#2B044D] py-3 font-semibold text-white transition hover:bg-[#3a0a6a] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Sudah punya akun?{" "}
          <a href="/login" className="text-purple-400 hover:underline">
            Login
          </a>
        </p>

        <div className="mt-6 border-t border-purple-400/30 pt-4 text-center">
          <p className="mb-3 text-sm text-gray-400">Daftar dengan</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/50 py-2 text-sm hover:bg-purple-400/10"
            >
              <Image src="/icons/google-icon.svg" alt="Google" width={18} height={18} />
              Google
            </button>

            <button
              type="button"
              onClick={handleDiscordRegister}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/50 py-2 text-sm hover:bg-purple-400/10"
            >
              <Image src="/icons/discord-icon.svg" alt="Discord" width={18} height={18} />
              Discord
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
