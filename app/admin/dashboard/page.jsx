"use client"

import { useState } from "react"
import { useAuth } from "../../../app/hooks/useAuth"

import {
  DollarSign,
  Users,
  Package,
  Boxes,
  Filter,
} from "lucide-react"

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

/* ================= PAGE ================= */

export default function DashboardPage() {
  const [transactionFilter, setTransactionFilter] = useState("hari_ini")
  const { user } = useAuth()

  const userName = user?.full_name || user?.name || "Admin"

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">

      {/* ================= HEADER ================= */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white lg:text-3xl">
          Dashboard Admin
        </h1>
        <p className="text-gray-400">
          Halo, Selamat datang <span className="font-semibold text-white">{userName}</span> 👋
        </p>
      </header>

      {/* ================= STATISTIK TRANSAKSI ================= */}
      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Statistik Transaksi
        </h2>
        <TransactionChart />
      </section>

      {/* ================= DATA TRANSAKSI ================= */}
      <section className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">
            Data Transaksi
          </h2>

          <div className="flex items-center gap-2">
            <Select
              value={transactionFilter}
              onValueChange={setTransactionFilter}
            >
              <SelectTrigger className="w-[120px] border-[#3d2b5e] bg-[#2d1b4e] text-white">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="border-[#3d2b5e] bg-[#1a1a2e] text-white">
                {TRANSACTION_FILTERS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-[#3d2b5e] bg-[#2d1b4e] text-white hover:bg-[#3d2b5e]"
            >
              <Filter className="mr-2 h-4 w-4" />
              Terapkan
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TransactionCard count="x90" amount="Rp 300.000" status="berhasil" />
          <TransactionCard count="x25" amount="Rp 300.000" status="pending" />
          <TransactionCard count="x15" amount="Rp 300.000" status="proses" />
          <TransactionCard count="x5" amount="Rp 300.000" status="gagal" />
        </div>
      </section>

      {/* ================= PROFIT ================= */}
      <section className="mb-8 space-y-4">
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
      </section>

      {/* ================= DATA USER ================= */}
      <section className="mb-8 space-y-4">
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
      </section>

      {/* ================= DATA PRODUK ================= */}
      <section className="mb-8 space-y-4">
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
      </section>

    </div>
  )
}
