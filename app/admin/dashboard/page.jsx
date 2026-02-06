"use client"

import { useState } from "react"
import { useAuth } from "../../../app/hooks/useAuth"
import { Filter, DollarSign, Users, Package, Boxes } from "lucide-react"
import { motion } from "framer-motion"

import TransactionChart from "../../components/admin/cards/TransactionChart"
import TransactionCard from "../../components/admin/cards/TransactionCard"
import StatCard from "../../components/admin/cards/StatCard"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { Button } from "../../components/ui/button"

/* ================= CONSTANT ================= */

const TRANSACTION_FILTERS = [
  { label: "Hari ini", value: "hari_ini" },
  { label: "7 Hari", value: "7_hari" },
  { label: "30 Hari", value: "30_hari" },
]

/* ================= ANIMATION ================= */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

/* ================= PAGE ================= */

export default function DashboardPage() {
  const { user } = useAuth()

  const [filterDraft, setFilterDraft] = useState("7_hari")
  const [appliedFilter, setAppliedFilter] = useState("7_hari")
  const [chartOffset, setChartOffset] = useState(0)

  const userName = user?.full_name || user?.name || "Admin"

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-background p-4 lg:p-6"
    >

      {/* ================= HEADER ================= */}
      <motion.header variants={item} className="mb-6">
        <h1 className="text-2xl font-bold text-white lg:text-3xl">
          Dashboard Admin
        </h1>
        <p className="text-gray-400">
          Halo, Selamat datang{" "}
          <span className="font-semibold text-white">
            {userName}
          </span>
        </p>
      </motion.header>

      {/* ================= STATISTIK TRANSAKSI ================= */}
      <motion.section variants={item} className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Statistik Transaksi
        </h2>

        <TransactionChart
          filter={appliedFilter}
          offset={chartOffset}
          setOffset={setChartOffset}
        />
      </motion.section>

      {/* ================= DATA TRANSAKSI ================= */}
      <motion.section variants={item} className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">
            Data Transaksi
          </h2>

          <div className="flex items-center gap-2">
            <Select value={filterDraft} onValueChange={setFilterDraft}>
              <SelectTrigger className="w-[120px] border-[#3d2b5e] bg-[#2d1b4e] text-white">
                <SelectValue />
              </SelectTrigger>

              <SelectContent className="border-[#3d2b5e] bg-[#1a1a2e] text-white">
                {TRANSACTION_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setAppliedFilter(filterDraft)
                setChartOffset(0)
              }}
              className="bg-purple-700 hover:bg-purple-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Terapkan
            </Button>
          </div>
        </div>

        <motion.div
          variants={item}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <TransactionCard status="berhasil" />
          <TransactionCard status="pending" />
          <TransactionCard status="proses" />
          <TransactionCard status="gagal" />
        </motion.div>
      </motion.section>

      {/* ================= PROFIT ================= */}
      <motion.section variants={item} className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Profit
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Rp 300.000"
            label="Profit Hari Ini"
            icon={DollarSign}
          />
          <StatCard
            title="Rp 2.500.000"
            label="Profit Bulan Ini"
            icon={DollarSign}
          />
          <StatCard
            title="Rp 150.000.000"
            label="Profit Total"
            icon={DollarSign}
          />
        </div>
      </motion.section>

      {/* ================= DATA USER ================= */}
      <motion.section variants={item} className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Data User
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="1205"
            label="Total User"
            icon={Users}
          />
          <StatCard
            title="Rp 150.000.000"
            label="Total Transaksi"
            icon={DollarSign}
          />
          <StatCard
            title="Rp 150.000.000"
            label="Total Top Up"
            icon={DollarSign}
          />
        </div>
      </motion.section>

      {/* ================= DATA PRODUK ================= */}
      <motion.section variants={item} className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Data Produk
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="90"
            label="Total Kategori Produk"
            icon={Boxes}
          />
          <StatCard
            title="7"
            label="Total Produk"
            icon={Package}
          />
        </div>
      </motion.section>

    </motion.div>
  )
}
