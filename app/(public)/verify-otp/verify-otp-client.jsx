'use client'

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "../../hooks/useAuth";
import Image from "next/image";

export default function VerifyOtpClient() {
  const router = useRouter();
  const params = useSearchParams();
  const challengeId = params.get("challenge_id");

  const { setUser } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!challengeId) {
        throw new Error("Challenge ID tidak ditemukan");
      }

      if (!API) {
        throw new Error("NEXT_PUBLIC_API_URL belum diset");
      }

      const res = await fetch(`${API}/api/v1/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          code,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json?.error?.message ||
            json?.message ||
            "OTP salah atau verifikasi gagal"
        );
      }

      const token = json?.data?.token;

      if (!token) {
        throw new Error("Token tidak ditemukan setelah verifikasi OTP");
      }

      const user = await fetchProfile(token);

      saveSession(token, user);
      setUser(user);

      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/customer");
      }
    } catch (err) {
      alert(err?.message || "Verifikasi OTP gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-950 to-black px-4">
      <div className="absolute w-[500px] h-[500px] bg-purple-700/20 blur-[150px] rounded-full"></div>

      <form
        onSubmit={handleVerify}
        className="relative w-full max-w-md backdrop-blur-xl bg-white/5 border border-purple-500/30 shadow-2xl shadow-purple-900/30 rounded-2xl p-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-transparent flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Image
              src="/logoherosection.png"
              alt="Growtech"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">
          Verifikasi OTP
        </h1>

        <p className="text-gray-400 text-sm text-center mb-8">
          Masukkan kode OTP yang dikirim ke akun Anda
        </p>

        <input
          type="text"
          placeholder="Masukkan kode OTP"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-4 rounded-lg bg-black/60 border border-purple-500/40 text-center tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        />

        <button
          disabled={loading}
          className="w-full mt-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition font-semibold shadow-lg shadow-purple-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Memverifikasi..." : "Verifikasi OTP"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Jika tidak menerima OTP, silakan login ulang
        </p>
      </form>
    </main>
  );
}