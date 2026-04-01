"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, Users, Package, Boxes, Layers } from "lucide-react";
import { motion } from "framer-motion";
import TransactionChart from "../../components/admin/cards/TransactionChart";
import TransactionCard from "../../components/admin/cards/TransactionCard";
import StatCard from "../../components/admin/cards/StatCard";
import PermissionGate from "../../components/admin/PermissionGate";
import { authFetch } from "../../lib/authFetch";
import { useAuth } from "../../../app/hooks/useAuth";

function formatRupiah(n) {
  const x = Math.floor(Number(n || 0));
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(x);
}

const RANGE_PRESETS = [
  { label: "Hari ini", value: "today" },
  { label: "7 hari", value: "7d" },
  { label: "30 hari", value: "30d" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.full_name || user?.name || "Admin";

  const [rangeApplied, setRangeApplied] = useState("7d");
  const [chartOffset, setChartOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("range", rangeApplied);
    return p.toString();
  }, [rangeApplied]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      setErr(null);

      try {
        const json = await authFetch(`/api/v1/admin/dashboard/summary?${queryString}`, {
          method: "GET",
        });

        if (!cancelled) {
          setData(json?.data || json || null);
          setChartOffset(0);
        }
      } catch (error) {
        if (!cancelled) {
          setErr(error?.message || "Gagal memuat dashboard");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const trx = data?.transactions_all_time ?? {};
  const revenue = data?.revenue ?? {};
  const profit = data?.profit ?? {};
  const products = data?.products ?? {};
  const usersData = data?.users ?? {};
  const chart = data?.chart ?? {};

  return (
    <PermissionGate permission="view_dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="min-h-screen bg-background p-4 lg:p-6"
      >
        <motion.header variants={item} className="mb-6">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">Dashboard Admin</h1>
          <p className="text-gray-400">
            Halo, selamat datang <span className="font-semibold text-white">{userName}</span>
          </p>
        </motion.header>

        <motion.div variants={item} className="mb-6 flex flex-wrap gap-3">
          {RANGE_PRESETS.map((preset) => {
            const active = rangeApplied === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setRangeApplied(preset.value)}
                className={`h-10 rounded-xl border px-4 text-sm font-medium transition ${
                  active
                    ? "border-purple-400 bg-purple-600 text-white"
                    : "border-[#3d2b5e] bg-[#2d1b4e] text-white hover:bg-[#3a2462]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </motion.div>

        {err && (
          <motion.div
            variants={item}
            className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200"
          >
            {err}
          </motion.div>
        )}

        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Revenue vs Profit</h2>
          <TransactionChart
            labels={chart.labels || []}
            revenue={chart.revenue || []}
            profit={chart.profit || []}
            offset={chartOffset}
            setOffset={setChartOffset}
            loading={loading}
          />
        </motion.section>

        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Data Transaksi</h2>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            <TransactionCard
              status="berhasil"
              count={trx?.success || 0}
              amount={formatRupiah(revenue?.total || 0)}
            />
            <TransactionCard status="pending" count={trx?.pending || 0} amount="" />
            <TransactionCard status="gagal" count={trx?.failed || 0} amount="" />
          </div>
        </motion.section>

        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Revenue</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title={formatRupiah(revenue?.today || 0)} label="Revenue Hari Ini" icon={DollarSign} variant="success" />
            <StatCard title={formatRupiah(revenue?.month || 0)} label="Revenue Bulan Ini" icon={DollarSign} variant="info" />
            <StatCard title={formatRupiah(revenue?.total || 0)} label="Revenue Total" icon={DollarSign} variant="default" />
          </div>
        </motion.section>

        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Profit</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title={formatRupiah(profit?.today || 0)} label="Profit Hari Ini" icon={DollarSign} variant="success" />
            <StatCard title={formatRupiah(profit?.month || 0)} label="Profit Bulan Ini" icon={DollarSign} variant="info" />
            <StatCard title={formatRupiah(profit?.total || 0)} label="Profit Total" icon={DollarSign} variant="default" />
          </div>
          <p className="text-xs text-gray-400">
            Catatan: profit memakai akumulasi margin produk per tier. Order baru akan membaca snapshot profit saat transaksi dibuat.
          </p>
        </motion.section>

        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Data User</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title={`${usersData?.total || 0}`} label="Total User" icon={Users} variant="default" />
            <StatCard title={formatRupiah(usersData?.total_transaction_nominal || 0)} label="Total Transaksi User" icon={DollarSign} variant="warning" />
            <StatCard
              title={`Member:${usersData?.by_tier?.member ?? 0} • Reseller:${usersData?.by_tier?.reseller ?? 0} • VIP:${usersData?.by_tier?.vip ?? 0}`}
              label="Total User per Tier"
              icon={Users}
              variant="info"
            />
          </div>
        </motion.section>

        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Data Produk</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title={`${products?.categories || 0}`} label="Total Kategori Produk" icon={Boxes} variant="default" />
            <StatCard title={`${products?.subcategories || 0}`} label="Total SubKategori Produk" icon={Layers} variant="info" />
            <StatCard title={`${products?.products || 0}`} label="Total Produk" icon={Package} variant="success" />
          </div>
        </motion.section>
      </motion.div>
    </PermissionGate>
  );
}
