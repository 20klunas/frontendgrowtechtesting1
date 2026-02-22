'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";   
import { useAuth } from "../../../app/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Login gagal")
      }

      const json = await res.json()
      const token = json.data.token

      Cookies.set("token", token, {
        path: "/",
        sameSite: "lax",
      })

      const profileRes = await fetch(`${API}/api/v1/auth/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!profileRes.ok) throw new Error("Gagal mengambil profile")

      const profileJson = await profileRes.json()

      setUser(profileJson.data)

      if (profileJson.data.role === "admin") {
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


  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/v1/auth/google/redirect`
  }

  const handleDiscordLogin = () => {
    window.location.href = `${API}/api/v1/auth/discord/redirect`
  }




  return (
    <main
      className="
        min-h-[calc(100vh-80px)]
        flex items-center justify-center
        px-4 pt-16
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl
          border border-purple-400/60
          bg-black
          p-8
        "
      >
        <h1 className="text-center text-2xl font-semibold text-purple-300 mb-6">
          Login
        </h1>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="text-sm text-purple-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="growtech@email.com"
              required
              className="
                mt-1 w-full rounded-lg
                border border-purple-400/50
                bg-black
                px-4 py-2
                text-white
                outline-none
                focus:border-purple-500
              "
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm text-purple-300">Password</label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}   // ✅ TOGGLE
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 pr-10 text-white outline-none focus:border-purple-500"
              />

              {/* ICON BUTTON */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-sm text-purple-400 hover:underline"
            >
              Lupa password?
            </a>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="
              mt-4 w-full
              rounded-xl
              bg-[#2B044D]
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#3a0a6a]
              disabled:opacity-50
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Belum punya akun?{" "}
          <a href="/register" className="text-purple-400 hover:underline">
            Register
          </a>
        </p>

        <div className="mt-6 border-t border-purple-400/30 pt-4 text-center">
          <p className="mb-3 text-sm text-gray-400">Masuk dengan</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="
                flex flex-1 items-center justify-center gap-2
                rounded-lg
                border border-purple-400/50
                py-2
                text-sm
                transition
                hover:bg-purple-400/10
              "
            >
              <Image
                src="/icons/google-icon.svg"
                alt="Google"
                width={18}
                height={18}
              />
              Google
            </button>

            <button
              type="button"
              onClick={handleDiscordLogin}
              className="
                flex flex-1 items-center justify-center gap-2
                rounded-lg
                border border-purple-400/50
                py-2
                text-sm
                transition
                hover:bg-purple-400/10
              "
            >
              <Image
                src="/icons/discord-icon.svg"
                alt="Discord"
                width={18}
                height={18}
              />
              Discord
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
