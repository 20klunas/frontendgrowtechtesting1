"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/hooks/useAuth";
import { Filter, DollarSign, Users, Package, Boxes, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import TransactionChart from "../../components/admin/cards/TransactionChart";
import TransactionCard from "../../components/admin/cards/TransactionCard";
import StatCard from "../../components/admin/cards/StatCard";
import PermissionGate from "../../components/admin/PermissionGate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// sesuaikan path kalau beda di project kamu
import { authFetch } from "../../lib/authFetch";

/* ================= HELPERS ================= */

function formatRupiah(n) {
  const x = Math.floor(Number(n || 0));
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(x);
}

/* ================= CONSTANT ================= */

const RANGE_PRESETS = [
  { label: "Hari ini", value: "today" },
  { label: "7 hari", value: "7d" },
  { label: "30 hari", value: "30d" },
];

/* ================= ANIMATION ================= */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ================= PAGE ================= */

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.full_name || user?.name || "Admin";

  // dropdown cepat
  const [rangeDraft, setRangeDraft] = useState("7d");
  const [rangeApplied, setRangeApplied] = useState("7d");

  // chart slider
  const [chartOffset, setChartOffset] = useState(0);

  // modal filter
  const [openFilter, setOpenFilter] = useState(false);

  // filter applied
  const [filtersApplied, setFiltersApplied] = useState({});

  // filter draft modal
  const [filtersDraft, setFiltersDraft] = useState({});

  // data API
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [openRange, setOpenRange] = useState(false);

  // build query string
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("range", rangeApplied);

    if (filtersApplied?.from && filtersApplied?.to) {
      p.set("from", filtersApplied.from);
      p.set("to", filtersApplied.to);
    }
    if (filtersApplied?.status) p.set("status", filtersApplied.status);
    if (filtersApplied?.product_id) p.set("product_id", filtersApplied.product_id);
    if (filtersApplied?.user_tier) p.set("user_tier", filtersApplied.user_tier);
    if (filtersApplied?.q) p.set("q", filtersApplied.q);

    return p.toString();
  }, [rangeApplied, filtersApplied]);

  async function fetchDashboard() {
    setLoading(true);
    setErr(null);

    try {
      const json = await authFetch(
        `/api/v1/admin/dashboard/summary?${queryString}`,
        { method: "GET" }
      );

      if (json?.success === false) {
        throw new Error(json?.error?.message || "Gagal memuat dashboard");
      }

      setData(json.data || json);
    } catch (e) {
      setErr(e?.message || "Terjadi error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setChartOffset(0);
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  // ===== mapping data backend
  const trx = data?.transactions_all_time ?? {};
  const revenue = data?.revenue ?? {};
  const products = data?.products ?? {};
  const usersData = data?.users ?? {};
  const chart = data?.chart ?? {};

  const statusCounts = trx?.by_status || {};
  const trxProcess = (statusCounts?.created || 0) + (statusCounts?.pending || 0);

  // options modal
  const productsOptions = data?.filter_options?.products || [];
  const statusOptions = data?.filter_options?.status || [
    "created",
    "pending",
    "paid",
    "fulfilled",
    "failed",
    "expired",
    "refunded",
  ];

  
  const tierOptions = data?.filter_options?.user_tier || ["member", "reseller", "vip"];

  return (
    <PermissionGate permission="view_dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="min-h-screen bg-background p-4 lg:p-6"
      >
        {/* HEADER */}
        <motion.header variants={item} className="mb-6">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">
            Dashboard Admin
          </h1>
          <p className="text-gray-400">
            Halo, Selamat datang{" "}
            <span className="font-semibold text-white">{userName}</span>
          </p>
        </motion.header>

        {/* TOOLBAR */}
        <motion.div
          variants={item}
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          {/* LEFT FILTER */}
          <div className="flex items-center gap-3">

            <div className="relative">

            <Button
              onClick={() => setOpenRange(!openRange)}
              className="h-10 bg-[#2d1b4e] border border-[#3d2b5e] text-[#fff] hover:bg-[#3a2462]"
            >
              Range
            </Button>

            {openRange && (
              <div className="absolute left-0 mt-2 w-40 rounded-lg border bg-white dark:bg-[#1a1a2e] shadow-lg z-50">

                {RANGE_PRESETS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setRangeDraft(f.value);
                      setRangeApplied(f.value);
                      setOpenRange(false);
                    }}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    {f.label}
                  </button>
                ))}

              </div>
            )}

            </div>

          </div>

          {/* RIGHT FILTER */}
          {/* <Button
            onClick={() => {
              setFiltersDraft(filtersApplied || {});
              setOpenFilter(true);
            }}
            className="h-10 bg-[#2d1b4e] border border-[#3d2b5e] text-[#2d1b4e] hover:bg-[#3a2462]"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button> */}
        </motion.div>

        {/* ERROR */}
        {err && (
          <motion.div
            variants={item}
            className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200"
          >
            {err}
          </motion.div>
        )}

        {/* STATISTIK TRANSAKSI */}
        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Statistik Transaksi</h2>

          <TransactionChart
            labels={chart.labels || []}
            values={chart.revenue || []}
            offset={chartOffset}
            setOffset={setChartOffset}
            loading={loading}
          />
        </motion.section>

        {/* DATA TRANSAKSI */}
        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Data Transaksi</h2>

          <motion.div
            variants={item}
            className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3"
          >
            <TransactionCard
              status="berhasil"
              count={trx?.success || 0}
              amount={formatRupiah(revenue?.total || 0)}
            />
            <TransactionCard status="pending" count={trx?.pending || 0} amount="" />
            {/* <TransactionCard status="proses" count={trxProcess || 0} amount="" /> */}
            <TransactionCard status="gagal" count={trx?.failed || 0} amount="" />
          </motion.div>
        </motion.section>

        {/* PROFIT */}
        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Profit</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={formatRupiah(revenue?.today || 0)}
              label="Profit Hari Ini"
              icon={DollarSign}
              variant="success"
            />
            <StatCard
              title={formatRupiah(revenue?.month || 0)}
              label="Profit Bulan Ini"
              icon={DollarSign}
              variant="info"
            />
            <StatCard
              title={formatRupiah(revenue?.total || 0)}
              label="Profit Total"
              icon={DollarSign}
              variant="default"
            />
          </div>
        </motion.section>

        {/* DATA USER */}
        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Data User</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={`${usersData?.total || 0}`}
              label="Total User"
              icon={Users}
              variant="default"
            />
            <StatCard
              title={formatRupiah(usersData?.total_transaction_nominal || 0)}
              label="Total Transaksi User"
              icon={DollarSign}
              variant="warning"
            />
            <StatCard
              title={`Member:${usersData?.by_tier?.member ?? 0} • Reseller:${usersData?.by_tier?.reseller ?? 0} • VIP:${usersData?.by_tier?.vip ?? 0}`}
              label="Total User per Tier"
              icon={Users}
              variant="info"
            />
          </div>
        </motion.section>

        {/* DATA PRODUK */}
        <motion.section variants={item} className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Data Produk</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={`${products?.categories || 0}`}
              label="Total Kategori Produk"
              icon={Boxes}
              variant="default"
            />
            <StatCard
              title={`${products?.subcategories || 0}`}
              label="Total SubKategori Produk"
              icon={Layers}
              variant="info"
            />
            <StatCard
              title={`${products?.products || 0}`}
              label="Total Produk"
              icon={Package}
              variant="success"
            />
          </div>
        </motion.section>

        {/* FILTER MODAL */}
        <AnimatePresence>
          {openFilter && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilter(false)}
            >
              <motion.div
                className="w-full max-w-3xl rounded-2xl border border-[#3d2b5e] bg-[#1a102b] p-6 text-white shadow-xl"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 18, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Menu Filter</h3>
                  <button
                    className="rounded-lg px-2 py-1 text-gray-300 hover:bg-white/10"
                    onClick={() => setOpenFilter(false)}
                  >
                    ✕
                  </button>
                </div>

                {/* Rentang tanggal */}
                <div className="mb-5 border-b border-white/10 pb-5">
                  <h4 className="mb-3 font-semibold">Rentang Tanggal</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm text-gray-300">Dari Tanggal</p>
                      <Input
                        type="date"
                        value={filtersDraft?.from || ""}
                        onChange={(e) =>
                          setFiltersDraft((s) => ({ ...s, from: e.target.value }))
                        }
                        className="border-[#3d2b5e] bg-white text-black"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-sm text-gray-300">Sampai Tanggal</p>
                      <Input
                        type="date"
                        value={filtersDraft?.to || ""}
                        onChange={(e) =>
                          setFiltersDraft((s) => ({ ...s, to: e.target.value }))
                        }
                        className="border-[#3d2b5e] bg-white text-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter tambahan */}
                <div className="mb-5">
                  <h4 className="mb-3 font-semibold">Filter Tambahan</h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Status */}
                    <div>
                      <p className="mb-2 text-sm text-gray-300">Status</p>
                      <Select
                        value={filtersDraft?.status || "Semua"}
                        onValueChange={(v) =>
                          setFiltersDraft((s) => ({
                            ...s,
                            status: v === "Semua" ? undefined : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-10 border-[#3d2b5e] bg-white text-black">
                          <SelectValue placeholder="Semua" />
                        </SelectTrigger>
                        <SelectContent className="border-[#3d2b5e] bg-white text-black">
                          <SelectItem value="Semua">Semua</SelectItem>
                          {statusOptions.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Produk */}
                    <div>
                      <p className="mb-2 text-sm text-gray-300">Produk</p>
                      <Select
                        value={filtersDraft?.product_id || "Semua"}
                        onValueChange={(v) =>
                          setFiltersDraft((s) => ({
                            ...s,
                            product_id: v === "Semua" ? undefined : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-10 border-[#3d2b5e] bg-white text-black">
                          <SelectValue placeholder="Semua" />
                        </SelectTrigger>
                        <SelectContent className="border-[#3d2b5e] bg-white text-black">
                          <SelectItem value="Semua">Semua</SelectItem>
                          {productsOptions.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipe user */}
                    <div>
                      <p className="mb-2 text-sm text-gray-300">Tipe User</p>
                      <Select
                        value={filtersDraft?.user_tier || "Semua"}
                        onValueChange={(v) =>
                          setFiltersDraft((s) => ({
                            ...s,
                            user_tier: v === "Semua" ? undefined : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-10 border-[#3d2b5e] bg-white text-black">
                          <SelectValue placeholder="Semua" />
                        </SelectTrigger>
                        <SelectContent className="border-[#3d2b5e] bg-white text-black">
                          <SelectItem value="Semua">Semua</SelectItem>
                          {tierOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Kata kunci */}
                    <div>
                      <p className="mb-2 text-sm text-gray-300">Kata Kunci</p>
                      <Input
                        value={filtersDraft?.q || ""}
                        placeholder="Masukan Kata Kunci"
                        onChange={(e) =>
                          setFiltersDraft((s) => ({ ...s, q: e.target.value }))
                        }
                        className="border-[#3d2b5e] bg-white text-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="h-10 border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={() => setFiltersDraft({})}
                  >
                    Reset
                  </Button>

                  <Button
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => {
                      const hasFrom = !!filtersDraft?.from;
                      const hasTo = !!filtersDraft?.to;

                      const fixed = { ...(filtersDraft || {}) };
                      if ((hasFrom && !hasTo) || (!hasFrom && hasTo)) {
                        delete fixed.from;
                        delete fixed.to;
                      }

                      setFiltersApplied(fixed);
                      setOpenFilter(false);
                    }}
                  >
                    Terap Filter
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PermissionGate>  
  );
}