"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

function formatRupiah(n) {
  const x = Math.floor(Number(n || 0));
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(x);
}

function toJuta(n) {
  return Number(n || 0) / 1_000_000;
}

export default function TransactionChart({
  labels = [],
  values = [],
  offset = 0,
  setOffset = () => {},
  loading = false,
}) {
  const [debouncedOffset, setDebouncedOffset] = useState(offset);

  // debounce slider biar smooth
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOffset(offset), 120);
    return () => clearTimeout(t);
  }, [offset]);

  const fullData = useMemo(() => {
    const L = Array.isArray(labels) ? labels : [];
    const V = Array.isArray(values) ? values : [];

    return L.map((date, i) => {
      const raw = Number(V[i] ?? 0);

      return {
        dayLabel: date,
        value: raw,
      };
    });
  }, [labels, values]);


  const windowSize = 7;

  const sliced = useMemo(() => {
    if (!fullData.length) return [];
    const maxStart = Math.max(0, fullData.length - windowSize);
    const start = Math.max(0, Math.min(debouncedOffset, maxStart));
    return fullData.slice(start, start + windowSize);
  }, [fullData, debouncedOffset]);

  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && theme === "dark";

  // kalau data berubah, pastikan offset ga out of range
  useEffect(() => {
    const max = Math.max(0, fullData.length - windowSize);
    if (offset > max) setOffset(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullData.length]);

  const gridColor = isDark ? "#3d2b5e" : "#e5e7eb";
  const axisColor = isDark ? "#a1a1aa" : "#6b7280";
  const tooltipBg = isDark ? "#1a1a2e" : "#ffffff";
  const tooltipBorder = isDark ? "#3d2b5e" : "#e5e7eb";
  const lineColor = isDark ? "#ffffff" : "#000000";


  return (
    <div className="rounded-xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#3d2b5e] p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Grafik Pemasukan</p>
        {loading ? (
          <span className="text-xs text-gray-400">Loading...</span>
        ) : (
          <span className="text-xs text-gray-400">
            {fullData.length ? `${fullData.length} hari` : "Tidak ada data"}
          </span>
        )}
      </div>

      <div className="h-[300px]">
        { mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sliced}>
              <CartesianGrid
                stroke={gridColor}
                strokeDasharray="3 3"
                vertical={false}
              />


              <XAxis
                dataKey="dayLabel"
                stroke={axisColor}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />

              <YAxis
                stroke={axisColor}
                domain={[0, "auto"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} jt`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} rb`;
                  return v;
                }}
              />

              <Tooltip
                formatter={(value) => formatRupiah(value)}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                }}
                labelStyle={{
                  color: isDark ? "#a78bfa" : "#4f46e5",
                  fontSize: 12
                }}
                itemStyle={{
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: 12
                }}
              />

              <Line
                type="natural"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                isAnimationActive
                animationDuration={600}
                dot={{
                  r: 5,
                  fill: isDark ? "#a855f7" : "#000000",
                  stroke: isDark ? "#0f172a" : "#ffffff",
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null }
      </div>

      {/* SLIDER */}
      <input
        type="range"
        min={0}
        max={Math.max(0, fullData.length - windowSize)}
        value={offset}
        onChange={(e) => setOffset(Number(e.target.value))}
        className="mt-4 w-full accent-black dark:accent-purple-500"
      />
    </div>
  );
}