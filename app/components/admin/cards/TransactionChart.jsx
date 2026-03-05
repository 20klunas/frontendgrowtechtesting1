"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useEffect, useMemo, useState } from "react"

function formatRupiah(n) {
  const x = Math.floor(Number(n || 0))
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(x)
}

function toJuta(n) {
  return Number(n || 0) / 1000000
}

export default function TransactionChart({
  labels,
  values,
  offset,
  setOffset,
  loading = false,
}) {
  const [debouncedOffset, setDebouncedOffset] = useState(offset)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOffset(offset), 120)
    return () => clearTimeout(t)
  }, [offset])

  const fullData = useMemo(() => {
    const L = Array.isArray(labels) ? labels : []
    const V = Array.isArray(values) ? values : []

    return L.map((date, i) => {
      const raw = Number(V[i] ?? 0)

      return {
        dayLabel: date,
        valueRaw: raw,
        valueJuta: toJuta(raw),
      }
    })
  }, [labels, values])

  const windowSize = 7

  const sliced = useMemo(() => {
    if (!fullData.length) return []

    const start = Math.max(
      0,
      Math.min(debouncedOffset, Math.max(0, fullData.length - windowSize))
    )

    return fullData.slice(start, start + windowSize)
  }, [fullData, debouncedOffset])

  useEffect(() => {
    const max = Math.max(0, fullData.length - windowSize)

    if (offset > max) setOffset(max)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullData.length])

  return (
    <div className="rounded-xl bg-[#1a1a2e] p-6 border border-[#3d2b5e]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Grafik Pemasukan</p>

        {loading ? (
          <span className="text-xs text-gray-400">Loading...</span>
        ) : (
          <span className="text-xs text-gray-400">
            {fullData.length ? `${fullData.length} hari` : "Tidak ada data"}
          </span>
        )}
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sliced}>
            <CartesianGrid
              stroke="#3d2b5e"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="dayLabel"
              stroke="#a1a1aa"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#a1a1aa"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${Number(v).toFixed(0)} jt`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #3d2b5e",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#a78bfa", fontSize: 12 }}
              itemStyle={{ color: "#ffffff", fontSize: 12 }}
              formatter={(_, __, props) => {
                const raw = props?.payload?.valueRaw ?? 0
                return [formatRupiah(raw), "Pemasukan"]
              }}
              labelFormatter={(label) => `Tanggal: ${label}`}
            />

            <Line
              type="monotone"
              dataKey="valueJuta"
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
              dot={{ r: 5, fill: "#7c3aed" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, fullData.length - windowSize)}
        value={offset}
        onChange={(e) => setOffset(Number(e.target.value))}
        className="mt-4 w-full"
      />
    </div>
  )
}