"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "../../../../../../../../lib/authFetch";
import {
  CheckCircle,
  Copy,
  Eye,
  Clock,
  AlertCircle,
} from "lucide-react";

/* ================= WRAPPER (WAJIB Suspense di Next 16) ================= */

export default function InvoicePageWrapper() {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceContent />
    </Suspense>
  );
}

/* ================= MAIN CONTENT ================= */

function InvoiceContent() {
  const { invoiceId } = useParams();

  const [data, setData] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [licenseKey, setLicenseKey] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  /* ===== FETCH DELIVERY INFO ===== */

  useEffect(() => {
    fetchDeliveryInfo();
  }, []);

  const fetchDeliveryInfo = async () => {
    try {
      const json = await authFetch(`/api/v1/orders/${invoiceId}/delivery`);

      if (json.success) {
        setData(json.data);

        // Jika backend bilang sudah pernah reveal
        if (json.data?.already_revealed) {
          setRevealed(true);
          setExpired(true);
        }
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError("Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  };

  /* ===== TIMER COUNTDOWN ===== */

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

  /* ===== REVEAL LICENSE KEY ===== */

  const handleReveal = async () => {
    if (revealing) return;

    setRevealing(true);

    try {
      const json = await authFetch(
        `/api/v1/orders/${invoiceId}/delivery/reveal`,
        { method: "POST" }
      );

      if (json.success) {
        const key = json.data?.data?.license_key;

        setLicenseKey(key);
        setRevealed(true);
        setExpired(false);
        setTimeLeft(300);
      } else {
        alert(json.message || "Tidak bisa reveal");
      }
    } catch (err) {
      alert("Reveal gagal");
    } finally {
      setRevealing(false);
    }
  };

  /* ===== COPY KEY ===== */

  const copyKey = async () => {
    if (!licenseKey) return;

    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  /* ===== STATES ===== */

  if (loading) return <InvoiceSkeleton />;

  if (error)
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" size={40} />
          <p>{error}</p>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <h1 className="text-3xl font-bold mb-6">
          Invoice #{invoiceId}
        </h1>

        {/* STATUS CARD */}
        <Card>
          <Info label="Status">
            <span className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} /> Completed
            </span>
          </Info>

          <Info label="Mode Pengiriman" value={data?.delivery_mode} />
          <Info label="Jumlah Pengiriman" value={data?.deliveries_count} />
        </Card>

        {/* LICENSE CARD */}
        <Card title="Akses Produk Digital">

          <p className="text-sm text-gray-400 mb-4">
            Kredensial hanya bisa dilihat <b>1 kali</b>
          </p>

          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={revealing || !data?.can_reveal}
              className="w-full border border-purple-500 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Eye size={18} />
              {revealing ? "Revealing..." : "Reveal License Key"}
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

                <span className="font-mono text-lg">
                  {expired ? "••••••••••••••" : licenseKey}
                </span>

                {!expired && (
                  <button onClick={copyKey}>
                    <Copy size={18} />
                  </button>
                )}
              </div>

              {copied && (
                <p className="text-green-400 text-sm mt-2">
                  ✓ Berhasil dicopy
                </p>
              )}

              {expired && (
                <p className="text-red-400 text-sm mt-2">
                  License key sudah expired
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, children }) {
  return (
    <div className="mb-6 rounded-3xl border border-purple-500/40 bg-gradient-to-br from-[#1a002e] to-black p-6">
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
      <div className="space-y-3 text-sm text-gray-300">{children}</div>
    </div>
  );
}

function Info({ label, value, children }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{value || children}</span>
    </div>
  );
}

/* ================= SKELETON ================= */

function InvoiceSkeleton() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white animate-pulse">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 bg-gray-800 rounded w-1/3" />
        <div className="h-32 bg-gray-900 rounded-3xl" />
        <div className="h-40 bg-gray-900 rounded-3xl" />
      </div>
    </main>
  );
}