"use client";

import { useEffect, useMemo, useState } from "react";
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
  isAdminUser,
} from "../../lib/authSession";
import {
  getTrustedDevicePreference,
  saveTrustedDeviceCredential,
  setTrustedDevicePreference,
} from "../../lib/trustedDevicePreference";

function isAdminFromCookies() {
  const token = Cookies.get("token");
  const role = String(Cookies.get("role") || "").toLowerCase();
  const isAdminFlag = ["1", "true"].includes(
    String(Cookies.get("is_admin") || "").toLowerCase()
  );
  const adminRoleId = Cookies.get("admin_role_id") || "";

  return Boolean(token) && (isAdminFlag || (role === "admin" && adminRoleId !== ""));
}

export default function LoginPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;
  const { user, setUser, refreshUser, loading: authLoading } = useAuth();
  const { beginTransition, finishTransition } = useAppTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    type: "info",
    message: "",
  });

  const currentUserTarget = useMemo(() => {
    if (isAdminUser(user || {})) return "/admin/dashboard";
    if (user) return "/customer";
    if (isAdminFromCookies()) return "/admin/dashboard";
    if (Cookies.get("token")) return "/customer";
    return null;
  }, [user]);

  useEffect(() => {
    setRememberDevice(getTrustedDevicePreference(true));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUserTarget) return;

    beginTransition(
      currentUserTarget,
      currentUserTarget === "/admin/dashboard"
        ? "Menyiapkan dashboard admin..."
        : "Menyiapkan dashboard Anda..."
    );

    router.replace(currentUserTarget);
  }, [authLoading, beginTransition, currentUserTarget, router]);

  const finishLogin = (authUser, token) => {
    const targetPath = resolvePostLoginPath(authUser);

    persistAuthSession(token, authUser);
    beginTransition(
      targetPath,
      targetPath === "/admin/dashboard"
        ? "Menyiapkan dashboard admin..."
        : "Menyiapkan dashboard Anda..."
    );
    setUser(authUser, { display: true });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:login"));
    }
    refreshUser?.().catch(() => {});
    router.replace(targetPath);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      setTrustedDevicePreference(rememberDevice);

      const json = await publicFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          remember: rememberDevice,
        }),
      });

      if (json?.data?.trusted_device_credential) {
        saveTrustedDeviceCredential(
          json.data.trusted_device_credential,
          json?.data?.trusted_device_expires_at || null
        );
      }

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

      finishLogin(authUser, token);
    } catch (err) {
      finishTransition();

      setPopup({
        open: true,
        type: "error",
        message: err?.message || "Sedang maintenance, coba beberapa saat lagi.",
      });
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

      setTrustedDevicePreference(rememberDevice);
      window.location.href = `${API}/api/v1/auth/google/redirect`;
    } catch (err) {
      setPopup({
        open: true,
        type: "error",
        message: err?.message || "Gagal memulai login Google",
      });
    }
  };

  const handleDiscordLogin = () => {
    if (!API) {
      setPopup({
        open: true,
        type: "error",
        message: "API belum dikonfigurasi",
      });
      return;
    }

    setTrustedDevicePreference(rememberDevice);
    window.location.href = `${API}/api/v1/auth/discord/redirect`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-black via-[#0a0014] to-[#1a0033]">
      {popup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#12061d] p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-3 text-lg font-semibold text-purple-300">
              Pemberitahuan
            </h2>
            <p className="mb-6 text-sm text-gray-300">{popup.message}</p>
            <button
              type="button"
              onClick={() => setPopup({ ...popup, open: false })}
              className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl rounded-2xl border border-purple-500/30 bg-white/5 p-6 text-white shadow-xl backdrop-blur-xl sm:p-8">
        <div className="mb-4 flex justify-center">
          <Image
            src="/logoherosection.png"
            alt="Growtech"
            width={70}
            height={70}
          />
        </div>

        <h1 className="mb-6 text-center text-xl font-semibold text-purple-300 sm:text-2xl">
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
              className="mt-1 w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full rounded-lg border border-purple-400/40 bg-black/40 px-4 py-2.5 pr-12 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 transition hover:text-purple-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-purple-400/20 bg-purple-900/20 px-4 py-3 text-xs text-gray-200">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="mt-1 h-4 w-4 accent-purple-500"
            />
            <span>Ingat perangkat ini untuk lewati OTP hingga 30 hari</span>
          </label>

          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-sm text-purple-400 transition hover:underline"
            >
              Lupa password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-400">
          Belum punya akun?{" "}
          <a href="/register" className="text-purple-400 hover:underline">
            Daftar
          </a>
        </p>

        <div className="mt-6 border-t border-purple-400/20 pt-4">
          <p className="mb-3 text-center text-sm text-gray-400">Atau login dengan</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/40 py-2.5 text-sm text-white transition hover:bg-purple-400/10"
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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-400/40 py-2.5 text-sm text-white transition hover:bg-purple-400/10"
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