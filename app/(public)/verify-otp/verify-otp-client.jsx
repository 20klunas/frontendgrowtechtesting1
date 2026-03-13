"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "../../hooks/useAuth";
import Image from "next/image";
import { publicFetch } from "../../lib/publicFetch";

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

      const json = await publicFetch("/api/v1/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({
          challenge_id: challengeId,
          code,
        }),
      });

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
      if (!err?.isMaintenance) {
        alert(err?.message || "Verifikasi OTP gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md rounded-2xl border border-purple-400/60 bg-black p-8 text-white">
        <div className="flex justify-center mb-5">
          <Image
            src="/logoherosection.png"
            alt="Growtech"
            width={90}
            height={90}
          />
        </div>

        <h1 className="text-center text-2xl font-semibold text-purple-300 mb-3">
          Verifikasi OTP
        </h1>

        <p className="text-center text-sm text-gray-400 mb-6">
          Masukkan kode OTP yang dikirim ke akun Anda
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="------"
            className="w-full p-4 rounded-lg bg-black/60 border border-purple-500/40 text-center tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2B044D] py-3 font-semibold text-white transition hover:bg-[#3a0a6a] disabled:opacity-50"
          >
            {loading ? "Memverifikasi..." : "Verifikasi OTP"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Jika tidak menerima OTP, silakan login ulang
        </p>
      </div>
    </main>
  );
}