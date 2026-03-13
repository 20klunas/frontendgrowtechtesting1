"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function MaintenanceClient() {
  const params = useSearchParams();

  const message =
    params.get("message") ||  "Website sedang maintenance";

  const scope =
    params.get("scope") ||  "system";

  const key =
    params.get("key") || "maintenance";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-xl rounded-2xl border border-purple-500/30 bg-zinc-950 p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">🚧</div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Maintenance
        </h1>

        <p className="text-gray-300 leading-relaxed mb-6">
          {message}
        </p>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-gray-400 space-y-1 mb-6">
          <div>
            <span className="text-gray-500">Scope:</span> {scope}
          </div>
          <div>
            <span className="text-gray-500">Key:</span> {key}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
          >
            Kembali ke Beranda
          </Link>

          <Link
            href="/login"
            className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            Ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}