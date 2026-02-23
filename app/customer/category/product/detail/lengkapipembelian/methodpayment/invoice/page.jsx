"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import {
  CheckCircle,
  Copy,
  Eye,
  Clock,
} from "lucide-react";

export default function InvoicePage() {
  const { invoiceId } = useParams();

  const [data, setData] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [licenseKey, setLicenseKey] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    fetchDeliveryInfo();
  }, []);

  useEffect(() => {
    if (!revealed || expired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [revealed, expired]);

  const fetchDeliveryInfo = async () => {
    const json = await authFetch(`/api/v1/orders/${invoiceId}/delivery`);
    if (json.success) setData(json.data);
  };

  const handleReveal = async () => {
    const json = await authFetch(
      `/api/v1/orders/${invoiceId}/delivery/reveal`,
      { method: "POST" }
    );

    if (json.success) {
      setLicenseKey(json.data.data.license_key);
      setRevealed(true);
    } else {
      alert(json.message);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(licenseKey);
  };

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold mb-6">
          Invoice #{invoiceId}
        </h1>

        <div className="rounded-3xl border border-purple-500/40 p-6 mb-6">
          <Info label="Status">
            <span className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} /> Completed
            </span>
          </Info>
          <Info label="Mode Pengiriman" value={data?.delivery_mode} />
        </div>

        <div className="rounded-3xl border border-purple-500/40 p-6">
          <p className="text-sm text-gray-400 mb-4">
            Kredensial hanya bisa dilihat 1 kali
          </p>

          {!revealed ? (
            <button
              onClick={handleReveal}
              className="w-full border border-purple-500 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Eye size={18} />
              Reveal License Key
            </button>
          ) : (
            <div>
              {!expired && (
                <p className="text-yellow-400 text-sm flex items-center gap-2 mb-2">
                  <Clock size={16} />
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </p>
              )}

              <div className="flex justify-between bg-black border border-purple-500/40 rounded-xl px-4 py-3">
                <span className="font-mono">
                  {expired ? "••••••••••" : licenseKey}
                </span>

                {!expired && (
                  <button onClick={copyKey}>
                    <Copy size={18} />
                  </button>
                )}
              </div>

              {expired && (
                <p className="text-red-400 text-sm mt-2">
                  License key expired
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Info({ label, value, children }) {
  return (
    <div className="flex justify-between text-sm text-gray-300">
      <span>{label}</span>
      <span className="text-white">{value || children}</span>
    </div>
  );
}