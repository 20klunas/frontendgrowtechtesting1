"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import useTopUpAccess from "../../hooks/useTopUpAccess";
import {
  fetchAvailableGateways,
  fetchWalletLedger,
  fetchWalletSummary,
  initTopUp,
} from "./topupApi";
import useMidtransSnap from "./useMidtransSnap";

const PRESETS = [
  { label: "Rp 10K", value: 10000 },
  { label: "Rp 25K", value: 25000 },
  { label: "Rp 50K", value: 50000 },
  { label: "Rp 100K", value: 100000 },
  { label: "Rp 150K", value: 150000 },
  { label: "Rp 300K", value: 300000 },
];

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("id-ID");
  } catch {
    return "-";
  }
}

export default function TopUpClient({
  initialToken,
  initialWallet,
  initialHistory,
  initialGateways,
}) {
  const router = useRouter();

  const [amount, setAmount] = useState(10000);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wallet, setWallet] = useState(initialWallet ?? null);
  const [history, setHistory] = useState(
    Array.isArray(initialHistory) ? initialHistory : []
  );
  const [gateways, setGateways] = useState(
    Array.isArray(initialGateways) ? initialGateways : []
  );
  const [paymentMethod, setPaymentMethod] = useState(
    Array.isArray(initialGateways) && initialGateways.length > 0
      ? initialGateways[0]
      : null
  );
  const [submitting, setSubmitting] = useState(false);

  const { topupDisabled, topupMessage, loading } = useTopUpAccess();

  const { snapLoading, snapReady, ensureSnapLoaded, openSnap } =
    useMidtransSnap(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);

  useEffect(() => {
    setPaymentMethod((current) => {
      if (!gateways.length) return null;
      if (current && gateways.some((item) => item.id === current.id)) {
        return current;
      }
      return gateways[0];
    });
  }, [gateways]);

  useEffect(() => {
    if (loading) return;

    if (topupDisabled) {
      setGateways([]);
      return;
    }

    if (gateways.length > 0) return;

    let active = true;

    (async () => {
      const nextGateways = await fetchAvailableGateways({ next: { revalidate: 30 } }); // cache 5 menit

      if (!active) return;

      setGateways(nextGateways);
    })();

    return () => {
      active = false;
    };
  }, [loading, topupDisabled, gateways.length]);

  useEffect(() => {
    if (!initialToken || loading || topupDisabled || snapReady) return;

    let timeoutId;
    let idleId;

    const preload = () => {
      ensureSnapLoaded().catch(() => {});
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(preload, { timeout: 2000 });

      return () => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    timeoutId = window.setTimeout(preload, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialToken, loading, topupDisabled, snapReady, ensureSnapLoaded]);

  const refreshWalletData = useCallback(async () => {
    if (!initialToken) return;

    const [walletResult, historyResult] = await Promise.allSettled([
      fetchWalletSummary(initialToken, { next: { revalidate: 30 } }), // cache 5 menit
      fetchWalletLedger(initialToken, { next: { revalidate: 30 } }), // cache 5 menit
    ]);

    if (walletResult.status === "fulfilled" && walletResult.value) {
      setWallet(walletResult.value);
    }

    if (historyResult.status === "fulfilled") {
      setHistory(Array.isArray(historyResult.value) ? historyResult.value : []);
    }
  }, [initialToken]);

  const fee = useMemo(() => {
    if (!paymentMethod) return 0;

    if (paymentMethod.feeType === "percent") {
      return Math.round((Number(amount || 0) * Number(paymentMethod.fee || 0)) / 100);
    }

    return Number(paymentMethod.fee || 0);
  }, [amount, paymentMethod]);

  const total = useMemo(() => Number(amount || 0) + Number(fee || 0), [amount, fee]);

  const actionLocked =
    loading ||
    topupDisabled ||
    !initialToken ||
    !paymentMethod ||
    submitting ||
    snapLoading;

  const handleCustomAmountChange = (event) => {
    const raw = String(event.target.value || "").replace(/[^\d]/g, "");
    setAmount(raw === "" ? 0 : Number(raw));
  };

  const handleTopup = async () => {
    if (amount < 10000) {
      alert("Minimal topup Rp 10.000");
      return;
    }

    if (!initialToken) {
      alert("Silakan login ulang");
      router.push("/login");
      return;
    }

    if (loading) {
      alert("Akses top up masih diperiksa, coba lagi sebentar.");
      return;
    }

    if (topupDisabled) {
      alert(topupMessage || "Top up sedang maintenance");
      return;
    }

    if (!paymentMethod) {
      alert("Metode pembayaran belum tersedia");
      return;
    }

    setSubmitting(true);

    try {
      const result = await initTopUp(initialToken, {
        amount,
        gatewayCode: paymentMethod.id,
      });

      const snapToken = result?.snap_token;
      const redirectUrl = result?.redirect_url;

      if (snapToken) {
        await openSnap(snapToken, {
          onSuccess: async () => {
            await refreshWalletData();
            setShowSuccess(true);
          },
          onPending: () => {
            alert("Menunggu pembayaran");
          },
          onError: () => {
            alert("Pembayaran gagal");
          },
          onClose: () => {
            console.log("User menutup popup pembayaran");
          },
        });

        return;
      }

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      alert("Gateway tidak memberikan metode pembayaran");
    } catch (error) {
      console.error("TOPUP ERROR:", error);
      alert(error?.message || "Topup gagal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-8 py-10 text-white">
      {loading && (
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-gray-400">
          Memeriksa akses top up...
        </div>
      )}

      {!loading && topupDisabled && (
        <div className="mb-6 rounded-xl border border-gray-600 bg-zinc-950 px-4 py-3 font-semibold text-gray-400">
          {topupMessage || "Top up sedang maintenance"}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-10">Top Up Saldo Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="space-y-6">
          <Card>
            <Header
              title="Saldo Wallet Anda"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="35"
                  height="35"
                  viewBox="0 0 24 24"
                >
                  <g
                    fill="none"
                    stroke="#9333ea"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  >
                    <path d="M17 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6" />
                    <path d="M20 12v4h-4a2 2 0 0 1 0-4z" />
                  </g>
                </svg>
              }
            />

            <p className="text-sm text-gray-400">Total Saldo</p>
            <p className="text-3xl font-bold mt-2 mb-2">
              {formatRupiah(wallet?.balance ?? 0)}
            </p>
            <p className="text-sm text-red-500">
              ⚠️ Topup untuk melakukan pembelian lebih banyak
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Pilih Jumlah Top Up</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  disabled={actionLocked}
                  onClick={() => setAmount(preset.value)}
                  className={`rounded-xl border py-3 transition ${
                    amount === preset.value
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-purple-700 hover:bg-purple-700/10"
                  } ${
                    actionLocked ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-400 mb-2">
              Atau Masukkan Jumlah Custom
            </p>

            <div className="flex border border-purple-700 rounded-xl overflow-hidden">
              <span className="px-4 py-3 text-gray-400">Rp</span>
              <input
                type="number"
                min="10000"
                inputMode="numeric"
                value={amount}
                onChange={handleCustomAmountChange}
                className="flex-1 bg-black px-4 py-3 outline-none"
                disabled={actionLocked}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">Ringkasan Top Up</h3>

            <div className="space-y-2 text-sm">
              <Row label="Jumlah Top Up" value={formatRupiah(amount)} />
              {/* <Row label="Fee Admin" value={formatRupiah(fee)} /> */}
            </div>

            <div className="border-t border-purple-700 mt-4 pt-4 flex justify-between font-semibold">
              <span>Ringkasan Top Up</span>
              <span>{formatRupiah(total)}</span>
            </div>

            <button
              onClick={handleTopup}
              disabled={actionLocked}
              title={topupDisabled ? topupMessage || "" : ""}
              className={`mt-6 w-full rounded-xl py-3 font-semibold transition ${
                actionLocked
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "border border-purple-500 hover:bg-purple-500/10 text-white"
              }`}
            >
              {loading
                ? "Memeriksa akses..."
                : topupDisabled
                ? "🔒 Top Up Maintenance"
                : !initialToken
                ? "Silakan Login"
                : submitting
                ? "Memproses..."
                : snapLoading
                ? "Menyiapkan pembayaran..."
                : "Lanjutkan Pembayaran"}
            </button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Metode Pembayaran</h3>

            <div className="space-y-4">
              {loading && (
                <div className="text-sm text-gray-400">
                  Memeriksa akses top up...
                </div>
              )}

              {!loading &&
                gateways.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method)}
                    disabled={topupDisabled}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 transition ${
                      paymentMethod?.id === method.id
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-purple-700 hover:bg-purple-700/10"
                    } ${topupDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span className="text-2xl">➜</span>

                    <div className="text-left">
                      <p className="font-semibold">{method.name}</p>
                      <p className="text-sm text-gray-400">{method.desc}</p>
                    </div>
                  </button>
                ))}

              {!loading && !topupDisabled && gateways.length === 0 && (
                <div className="text-sm text-gray-400">
                  Metode pembayaran belum tersedia.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Riwayat Top Up</h3>
          <button
            onClick={refreshWalletData}
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-purple-700 text-gray-400">
              <tr>
                <th className="py-3 text-left">No</th>
                <th className="text-left">Jumlah</th>
                <th className="text-left">Metode</th>
                <th className="text-left">Tanggal & Jam</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {history.length > 0 ? (
                history.map((row, index) => (
                  <tr key={row.id ?? `${row.created_at}-${index}`} className="border-b border-purple-800/40">
                    <td className="py-3">{index + 1}</td>
                    <td>{formatRupiah(row.amount || 0)}</td>
                    <td>{row.type || "-"}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td
                      className={
                        row.direction === "CREDIT"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {row.direction || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-400">
                    Belum ada riwayat top up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showSuccess && (
        <Modal onClose={() => setShowSuccess(false)}>
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-green-400 mb-2">
              Top Up Berhasil!
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Saldo Anda berhasil diperbarui
            </p>

            <p className="text-sm text-gray-400">Saldo Terbaru</p>
            <p className="text-2xl font-bold mb-6">
              {formatRupiah(wallet?.balance ?? 0)}
            </p>

            <button
              onClick={() => router.push("/customer/category")}
              className="w-full bg-purple-700 rounded-xl py-3 font-semibold"
            >
              Mulai Berbelanja
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-purple-700 bg-black p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400"
        >
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="border border-purple-700 rounded-2xl p-6 bg-black">
      {children}
    </div>
  );
}

function Header({ title, icon }) {
  return (
    <div className="flex justify-between mb-4">
      <h3 className="font-semibold">{title}</h3>
      <span>{icon}</span>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-gray-300">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}