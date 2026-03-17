"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { publicFetch } from "../../lib/publicFetch";

export default function LoginPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authDisabled,setAuthDisabled] = useState(false)
  const [authMessage,setAuthMessage] = useState("")

  const [popup, setPopup] = useState({
    open: false,
    type: "info",
    message: ""
  });

  const saveSession = (token, user) => {
    Cookies.set("token", token, {
      path: "/",
      sameSite: "lax",
    });

    Cookies.set("role", user.role || "user", {
      path: "/",
      sameSite: "lax",
    });

    Cookies.set("user_name", user.name || user.full_name || "", {
      path: "/",
      sameSite: "lax",
    });

    Cookies.set("user_email", user.email || "", {
      path: "/",
      sameSite: "lax",
    });
  };

  const fetchProfile = async (token) => {
    const profileRes = await fetch(`${API}/api/v1/auth/me/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const profileJson = await profileRes.json();

    if (!profileJson.success) {
      throw new Error(
        profileJson?.error?.message ||
          profileJson?.message ||
          "Gagal mengambil profile user"
      );
    }

    const user = profileJson?.data;

    if (!user) {
      throw new Error("Data user tidak ditemukan");
    }

    return user;
  };

  const saveSessionAndRedirect = async (token) => {
    const user = await fetchProfile(token);

    saveSession(token, user);
    setUser(user);

    if (user.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      await new Promise((r) => setTimeout(r, 100))
      router.replace("/customer")
    }
  };

  const { user, loading } = useAuth()

  useEffect(() => {
    const token = Cookies.get("token")

    if (token) {
      router.replace("/customer")
    }
  }, [user, loading])

  useEffect(() => {

    if (loading) return

    if (user) {
      router.replace("/customer")
    }

  }, [user, loading])

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!API) {
        throw new Error("NEXT_PUBLIC_API_URL belum diset");
      }

      const json = await publicFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (json?.data?.requires_2fa) {
        router.push(`/verify-otp?challenge_id=${json.data.challenge_id}`);
        return;
      }

      const token = json?.data?.token;

      if (!token) {
        throw new Error("Token login tidak ditemukan");
      }

      await saveSessionAndRedirect(token);
    } catch (err) {
      if (!err?.isMaintenance) {
        setPopup({
          open: true,
          type: "error",
          message: err?.message || "Sedang Maintenance, coba beberapa saat lagi."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {

    try {

      if (!API) {
        setPopup({
          open: true,
          type: "error",
          message: "API belum dikonfigurasi"
        });
        return;
      }

      window.location.href = `${API}/api/v1/auth/google/redirect`;

    } catch (err) {

      if (err?.isMaintenance) {
        setPopup({
          open: true,
          type: "error",
          message: err.message || "Login sedang maintenance"
        });
        return;
      }

      setPopup({
        open: true,
        type: "error",
        message: "Gagal memulai login Google"
      });

    }

  };

  const handleDiscordLogin = () => {
    if (!API) {
      alert("NEXT_PUBLIC_API_URL belum diset");
      return;
    }

    window.location.href = `${API}/api/v1/auth/discord/redirect`;
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md rounded-2xl border border-purple-400/60 bg-black p-8">
        {popup.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-[380px] rounded-2xl border border-purple-500 bg-black p-6 shadow-xl">

              <h2 className="text-lg font-semibold text-purple-300 mb-3">
                Pemberitahuan !
              </h2>

              <p className="text-sm text-gray-300 mb-6">
                {popup.message}
              </p>

              <button
                onClick={() => setPopup({ ...popup, open: false })}
                className="w-full rounded-lg bg-purple-600 py-2 font-semibold hover:bg-purple-700 transition"
              >
                Tutup
              </button>

            </div>
          </div>
        )}
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
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Password</label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 pr-10 text-white outline-none focus:border-purple-500"
              />

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
            className="mt-4 w-full rounded-xl bg-[#2B044D] py-3 font-semibold text-white transition hover:bg-[#3a0a6a] disabled:opacity-50"
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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/50 py-2 text-sm hover:bg-purple-400/10"
            >
              <Image src="/icons/google-icon.svg" alt="Google" width={18} height={18} />
              Google
            </button>

            <button
              type="button"
              onClick={handleDiscordLogin}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/50 py-2 text-sm hover:bg-purple-400/10"
            >
              <Image src="/icons/discord-icon.svg" alt="Discord" width={18} height={18} />
              Discord
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}