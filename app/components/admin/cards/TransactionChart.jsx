"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

export default function TransactionChart({
  labels = [],
  revenue = [],
  profit = [],
  offset = 0,
  setOffset = () => {},
  loading = false,
}) {
  const [debouncedOffset, setDebouncedOffset] = useState(offset);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOffset(offset), 120);
    return () => clearTimeout(t);
  }, [offset]);

  const fullData = useMemo(() => {
    const safeLabels = Array.isArray(labels) ? labels : [];
    const safeRevenue = Array.isArray(revenue) ? revenue : [];
    const safeProfit = Array.isArray(profit) ? profit : [];

    return safeLabels.map((dayLabel, index) => ({
      dayLabel,
      revenue: Number(safeRevenue[index] ?? 0),
      profit: Number(safeProfit[index] ?? 0),
    }));
  }, [labels, revenue, profit]);

  const windowSize = 7;

  const sliced = useMemo(() => {
    if (!fullData.length) return [];
    const maxStart = Math.max(0, fullData.length - windowSize);
    const start = Math.max(0, Math.min(debouncedOffset, maxStart));
    return fullData.slice(start, start + windowSize);
  }, [fullData, debouncedOffset]);

  useEffect(() => {
    const max = Math.max(0, fullData.length - windowSize);
    if (offset > max) setOffset(max);
  }, [fullData.length, offset, setOffset]);

  const isDark = mounted && theme === "dark";
  const gridColor = isDark ? "#3d2b5e" : "#e5e7eb";
  const axisColor = isDark ? "#a1a1aa" : "#6b7280";
  const tooltipBg = isDark ? "#1a1a2e" : "#ffffff";
  const tooltipBorder = isDark ? "#3d2b5e" : "#e5e7eb";

  return (
    <div className="rounded-xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#3d2b5e] p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Grafik Revenue vs Profit
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Profit menggunakan margin produk per tier yang disimpan backend.
          </p>
        </div>

        {loading ? (
          <span className="text-xs text-gray-400">Loading...</span>
        ) : (
          <span className="text-xs text-gray-400">
            {fullData.length ? `${fullData.length} hari` : "Tidak ada data"}
          </span>
        )}
      </div>

      <div className="h-[320px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sliced} barGap={8}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dayLabel" stroke={axisColor} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
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
                formatter={(value, name, props) => {
                  const key = props.dataKey;

                  return [
                    formatRupiah(value),
                    key === "revenue" ? "Revenue" : "Profit"
                  ];
                }}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                }}
                labelStyle={{ color: isDark ? "#a78bfa" : "#4f46e5", fontSize: 12 }}
                itemStyle={{ color: isDark ? "#ffffff" : "#111827", fontSize: 12 }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
              <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]} fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

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
