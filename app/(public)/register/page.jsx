"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { publicFetch } from "../../lib/publicFetch";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    name: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.password !== form.password_confirmation) {
      alert("Password dan konfirmasi tidak sama");
      setLoading(false);
      return;
    }

    try {
      const json = await publicFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (json?.data?.requires_2fa) {
        router.push(`/verify-otp?challenge_id=${json.data.challenge_id}`);
        return;
      }
    } catch (err) {
      if (!err?.isMaintenance) {
        alert(err?.message || "Register gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleGoogleRegister = () => {
    if (!API) {
      alert("NEXT_PUBLIC_API_URL belum diset");
      return;
    }

    window.location.href = `${API}/api/v1/auth/google/redirect`;
  };

  const handleDiscordRegister = () => {
    if (!API) {
      alert("NEXT_PUBLIC_API_URL belum diset");
      return;
    }

    window.location.href = `${API}/api/v1/auth/discord/redirect`;
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-xl rounded-2xl border border-purple-400/60 bg-black p-8">
        <h1 className="text-center text-2xl font-semibold text-purple-300 mb-6">
          Register
        </h1>

        <form
          onSubmit={handleRegister}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="text-sm text-purple-300">Email</label>
            <input
              name="email"
              type="email"
              required
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Password</label>
            <input
              name="password"
              type="password"
              required
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">Nama</label>
            <input
              name="name"
              type="text"
              required
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-purple-300">
              Konfirmasi Password
            </label>
            <input
              name="password_confirmation"
              type="password"
              required
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-purple-400/50 bg-black px-4 py-2 text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <button
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-[#2B044D] py-3 font-semibold text-white hover:bg-[#3a0a6a] disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
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
  );
}