"use client";

import { useSearchParams } from "next/navigation";

export default function MaintenanceClient() {
  const params = useSearchParams();

  const message = params.get("message") || "Website sedang maintenance";
  const scope = params.get("scope") || "system";
  const key = params.get("key") || "maintenance";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-lg w-full text-center border border-gray-100">
        <h1 className="text-3xl font-bold mb-4">
          🚧 Maintenance
        </h1>

        <p className="text-gray-600 mb-4 leading-relaxed">
          {message}
        </p>

        <div className="space-y-1 text-sm text-gray-400">
          <div>Scope: {scope}</div>
          <div>Key: {key}</div>
        </div>
      </div>
    </div>
  );
}