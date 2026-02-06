'use client'

import { CheckCircle, Clock, Eye, X } from "lucide-react"
import { cn } from "../../../lib/utils"

const statusConfig = {
  berhasil: {
    label: "Berhasil",
    icon: CheckCircle,
    gradient: "from-emerald-600/20 to-emerald-900/40",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    glow: "hover:shadow-emerald-500/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    gradient: "from-purple-600/20 to-purple-900/40",
    border: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    glow: "hover:shadow-purple-500/20",
  },
  proses: {
    label: "Proses",
    icon: Eye,
    gradient: "from-indigo-600/20 to-indigo-900/40",
    border: "border-indigo-500/30",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    glow: "hover:shadow-indigo-500/20",
  },
  gagal: {
    label: "Gagal",
    icon: X,
    gradient: "from-red-600/20 to-red-900/40",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    glow: "hover:shadow-red-500/20",
  },
}

export default function TransactionCard({ count, amount, status }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        "bg-gradient-to-br",
        config.gradient,
        config.border,
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        config.glow
      )}
    >
      {/* Glow layer */}
      <div className="pointer-events-none absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition" />

      <div className="relative flex items-center justify-between">
        {/* LEFT */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {config.label}
          </p>

          <p className="text-2xl font-bold text-white">
            {count}
          </p>

          <p className="text-sm text-gray-300">
            {amount}
          </p>
        </div>

        {/* ICON */}
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            config.iconBg
          )}
        >
          <Icon className={cn("h-6 w-6", config.iconColor)} />
        </div>
      </div>
    </div>
  )
}
