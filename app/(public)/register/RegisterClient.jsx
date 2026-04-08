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
    if (!API) return alert("NEXT_PUBLIC_API_URL belum diset")
    setTrustedDevicePreference(form.remember)
    window.location.href = `${API}/api/v1/auth/google/redirect`
  }

  const handleDiscordRegister = () => {
    if (!API) return alert("NEXT_PUBLIC_API_URL belum diset")
    setTrustedDevicePreference(form.remember)
    window.location.href = `${API}/api/v1/auth/discord/redirect`
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-black via-[#0a0014] to-[#1a0033]">

      {/* CARD */}
      <div className="w-full max-w-xl rounded-2xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-xl p-6 sm:p-8 text-white">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image src="/logoherosection.png" alt="Growtech" width={70} height={70} />
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-purple-300 mb-6 text-center">
          Create Account
        </h1>

        <form className="space-y-4" onSubmit={handleRegister}>

          {/* Nama + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-purple-300">Nama</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
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
                className="mt-1 w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-purple-300">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            <div>
              <label className="text-sm text-purple-300">Konfirmasi</label>
              <input
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          {/* Referral */}
          <div>
            <label className="text-sm text-purple-300">Kode Referral</label>
            <input
              type="text"
              name="referral_code"
              value={form.referral_code}
              onChange={handleChange}
              placeholder="Opsional"
              className="mt-1 w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Remember */}
          <label className="flex items-start gap-3 rounded-xl border border-purple-400/20 bg-purple-900/20 px-4 py-3 text-xs text-gray-200">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className="mt-1 h-4 w-4 accent-purple-500"
            />
            <span>Ingat perangkat ini (skip OTP 30 hari)</span>
          </label>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* LOGIN */}
        <p className="mt-5 text-center text-sm text-gray-400">
          Sudah punya akun?{" "}
          <a href="/login" className="text-purple-400 hover:underline">
            Login
          </a>
        </p>

        {/* SOCIAL */}
        <div className="mt-6 border-t border-purple-400/20 pt-4">
          <p className="text-center text-sm text-gray-400 mb-3">Atau daftar dengan</p>

          <div className="flex gap-3">
            <button
              onClick={handleGoogleRegister}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-purple-400/40 py-2 text-sm hover:bg-purple-400/10 transition"
            >
              <Image src="/icons/google-icon.svg" alt="Google" width={18} height={18} />
              Google
            </button>

            <button
              onClick={handleDiscordRegister}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-purple-400/40 py-2 text-sm hover:bg-purple-400/10 transition"
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