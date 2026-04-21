"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";
import { useMaintenance } from "../../context/MaintenanceContext";

function isAdminSession() {
  const role = String(Cookies.get("role") || "").toLowerCase();
  const hasToken = Boolean(Cookies.get("token"));
  const isAdminFlag = Cookies.get("is_admin") === "1";
  const adminRoleId = Cookies.get("admin_role_id") || "";

  return hasToken && (isAdminFlag || (role === "admin" && adminRoleId !== ""));
}

export default function MaintenanceClient() {
  const params = useSearchParams();
  const { loading, refreshMaintenance } = useMaintenance();

  const message = params.get("message") || "Website sedang maintenance";
  const scope = params.get("scope") || "system";
  const key = params.get("key") || "maintenance";
  const adminSession = isAdminSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-xl rounded-2xl border border-purple-500/30 bg-zinc-950 p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">🚧</div>

        <h1 className="text-3xl font-bold text-white mb-3">Maintenance</h1>

        <p className="text-gray-300 leading-relaxed mb-6">{message}</p>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-gray-400 space-y-1 mb-6">
          <div>
            <span className="text-gray-500">Scope:</span> {scope}
          </div>
          <div>
            <span className="text-gray-500">Key:</span> {key}
          </div>
          <div>
            <span className="text-gray-500">Sync:</span> {loading ? "Memeriksa status terbaru..." : "Auto refresh aktif"}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => refreshMaintenance()}
            className="px-5 py-2 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
          >
            Cek Lagi Sekarang
          </button>

          <Link
            href="/"
            className="px-5 py-2 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
          >
            Kembali ke Beranda
          </Link>

          {adminSession ? (
            <Link
              href="/admin/dashboard"
              className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Ke Dashboard Admin
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Ke Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
