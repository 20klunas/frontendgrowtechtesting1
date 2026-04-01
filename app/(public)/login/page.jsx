"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAppTransition } from "../../hooks/useAppTransition";
import { publicFetch } from "../../lib/publicFetch";
import {
  persistAuthSession,
  resolvePostLoginPath,
} from "../../lib/authSession";

export default function LoginPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;
  const { user, setUser, loading: authLoading } = useAuth();
  const { beginTransition, finishTransition } = useAppTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
    if (authLoading) return;

    const token = Cookies.get("token");
    const role = user?.role || Cookies.get("role") || "user";

    if (!token) return;

    const targetPath = role === "admin" ? "/admin/dashboard" : "/customer";

    beginTransition(
      targetPath,
      role === "admin"
        ? "Menyiapkan dashboard admin..."
        : "Menyiapkan dashboard Anda..."
    );

    router.replace(targetPath);
  }, [authLoading, beginTransition, router, user]);

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
      const authUser = json?.data?.user;

      if (!token) {
        throw new Error("Token login tidak ditemukan");
      }

      if (!authUser) {
        throw new Error("Data user login tidak ditemukan");
      }

      const targetPath = resolvePostLoginPath(authUser);

      persistAuthSession(token, authUser);
      beginTransition(
        targetPath,
        targetPath === "/admin/dashboard"
          ? "Menyiapkan dashboard admin..."
          : "Menyiapkan dashboard Anda..."
      );
      setUser(authUser, { display: false });
      router.replace(targetPath);
    } catch (err) {
      finishTransition();

      if (!err?.isMaintenance) {
        setPopup({
          open: true,
          type: "error",
          message:
            err?.message || "Sedang Maintenance, coba beberapa saat lagi.",
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
          message: "API belum dikonfigurasi",
        });
        return;
      }

      window.location.href = `${API}/api/v1/auth/google/redirect`;
    } catch (err) {
      if (err?.isMaintenance) {
        setPopup({
          open: true,
          type: "error",
          message: err.message || "Login sedang maintenance",
        });
        return;
      }

      setPopup({
        open: true,
        type: "error",
        message: "Gagal memulai login Google",
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
            <div className="w-95 rounded-2xl border border-purple-500 bg-black p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-purple-300 mb-3">
                Pemberitahuan !
              </h2>

              <p className="text-sm text-gray-300 mb-6">{popup.message}</p>

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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/50 py-2 text-sm hover:bg-purple-400/10"
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