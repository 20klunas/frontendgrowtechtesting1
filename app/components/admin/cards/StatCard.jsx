'use client'

import { cn } from "../../../lib/utils"

const variantStyles = {
  default: {
    gradient: "from-purple-600/20 to-purple-900/40",
    border: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-300",
    glow: "hover:shadow-purple-500/20",
  },
  success: {
    gradient: "from-emerald-600/20 to-emerald-900/40",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-300",
    glow: "hover:shadow-emerald-500/20",
  },
  info: {
    gradient: "from-indigo-600/20 to-indigo-900/40",
    border: "border-indigo-500/30",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-300",
    glow: "hover:shadow-indigo-500/20",
  },
  warning: {
    gradient: "from-amber-600/20 to-amber-900/40",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-300",
    glow: "hover:shadow-amber-500/20",
  },
  danger: {
    gradient: "from-red-600/20 to-red-900/40",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-300",
    glow: "hover:shadow-red-500/20",
  },
}

export default function StatCard({
  title,
  value,
  label,
  icon: Icon,
  variant = "default",
}) {
  const v = variantStyles[variant] || variantStyles.default

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        "bg-gradient-to-br",
        v.gradient,
        v.border,
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        v.glow
      )}
    >
      {/* glow layer */}
      <div className="pointer-events-none absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition" />

      <div className="relative flex items-center justify-between">
        {/* LEFT */}
        <div className="space-y-1">
          {label && (
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {label}
            </p>
          )}

          <p className="text-2xl font-bold text-white">
            {title}
          </p>

          {value && (
            <p className="text-sm text-gray-300">
              {value}
            </p>
          )}
        </div>

        {/* ICON */}
        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              v.iconBg
            )}
          >
            <Icon className={cn("h-6 w-6", v.iconColor)} />
          </div>
        )}
      </div>
    </div>
  )
}
