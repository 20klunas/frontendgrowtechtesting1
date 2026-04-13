"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import { useAppTransition } from "../../hooks/useAppTransition";
import { publicFetch } from "../../lib/publicFetch";
import {
  clearTrustedDeviceCredential,
  saveTrustedDeviceCredential,
} from "../../lib/trustedDevicePreference";
import {
  persistAuthSession,
  resolvePostLoginPath,
} from "../../lib/authSession";

export default function VerifyOtpClient() {
  const router = useRouter();
  const params = useSearchParams();
  const challengeId = params.get("challenge_id");
  const { setUser } = useAuth();
  const { beginTransition, finishTransition } = useAppTransition();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!challengeId) {
        throw new Error("Challenge ID tidak ditemukan");
      }

      const json = await publicFetch("/api/v1/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({
          challenge_id: challengeId,
          code,
        }),
      });

      const token = json?.data?.token;
      const authUser = json?.data?.user;

      if (!token) {
        throw new Error("Token tidak ditemukan setelah verifikasi OTP");
      }

      if (!authUser) {
        throw new Error("Data user tidak ditemukan setelah verifikasi OTP");
      }

      if (json?.data?.trusted_device_credential) {
        saveTrustedDeviceCredential(
          json.data.trusted_device_credential,
          json?.data?.trusted_device_expires_at || null
        );
      } else {
        clearTrustedDeviceCredential();
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