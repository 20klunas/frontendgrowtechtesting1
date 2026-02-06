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

// MOCK DATA SOURCE
const DATASET = {
  hari_ini: Array.from({ length: 8 }, (_, i) => ({ day: i + 1, value: Math.random() * 80 })),
  "7_hari": Array.from({ length: 14 }, (_, i) => ({ day: i + 1, value: Math.random() * 80 })),
  "30_hari": Array.from({ length: 40 }, (_, i) => ({ day: i + 1, value: Math.random() * 80 })),
}

export default function TransactionChart({ filter, offset, setOffset }) {
  const [debouncedOffset, setDebouncedOffset] = useState(offset)

  /* 🔹 debounce slider */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOffset(offset), 200)
    return () => clearTimeout(t)
  }, [offset])

  /* 🔹 realtime refresh */
  const [dataSource, setDataSource] = useState(DATASET)
  useEffect(() => {
    const interval = setInterval(() => {
      setDataSource({ ...DATASET })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const data = useMemo(() => {
    return dataSource[filter].slice(debouncedOffset, debouncedOffset + 7)
  }, [filter, debouncedOffset, dataSource])

  return (
    <div className="rounded-xl bg-[#1a1a2e] p-6 border border-[#3d2b5e]">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#3d2b5e" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="#a1a1aa" />
            <YAxis domain={[0, 80]} stroke="#a1a1aa" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #3d2b5e",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#a78bfa", fontSize: 12 }}
              itemStyle={{ color: "#ffffff", fontSize: 12 }}
              formatter={(value) => [`Rp ${value.toFixed(1)} Juta`, "Transaksi"]}
              labelFormatter={(label) => `Hari ke-${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
              dot={{ r: 5, fill: "#7c3aed" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SLIDER */}
      <input
        type="range"
        min={0}
        max={Math.max(0, dataSource[filter].length - 7)}
        value={offset}
        onChange={(e) => setOffset(Number(e.target.value))}
        className="mt-4 w-full"
      />
    </div>
  )
}
