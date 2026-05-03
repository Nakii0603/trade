"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { bucketSession } from "@/lib/sessionBucket";
import type { TradeDTO } from "@/types/trade";

type RangeKey = "1d" | "7d" | "30d";

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function filterByRange(trades: TradeDTO[], key: RangeKey): TradeDTO[] {
  const now = Date.now();
  const ms =
    key === "1d" ? 86400000 : key === "7d" ? 7 * 86400000 : 30 * 86400000;
  const from = now - ms;
  return trades.filter((t) => new Date(t.createdAt).getTime() >= from);
}

function cumulativeSeries(trades: TradeDTO[]) {
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let cum = 0;
  return sorted.map((t, i) => {
    cum += t.profit;
    return {
      i: i + 1,
      label: new Date(t.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      profit: t.profit,
      cumulative: Math.round(cum * 100) / 100,
    };
  });
}

function sessionTotals(trades: TradeDTO[]) {
  const map = new Map<string, number>();
  for (const t of trades) {
    const b = bucketSession(t.session);
    map.set(b, (map.get(b) ?? 0) + t.profit);
  }
  const order = ["Asia", "London", "New York", "Other"];
  return order.map((name) => ({ name, total: map.get(name) ?? 0 }));
}

export function AnalyticsPanel({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<RangeKey>("7d");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/trades");
      if (!res.ok) throw new Error("Could not load trades");
      const data = (await res.json()) as TradeDTO[];
      setTrades(Array.isArray(data) ? data : []);
    } catch {
      setErr("Check MongoDB is running and MONGODB_URI is set.");
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / refreshKey
    void load();
  }, [load, refreshKey]);

  const metrics = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => t.isWin).length;
    const winRate = total ? Math.round((wins / total) * 1000) / 10 : 0;
    const totalProfit =
      Math.round(trades.reduce((s, t) => s + t.profit, 0) * 100) / 100;
    const bySession = new Map<string, number>();
    for (const t of trades) {
      const b = bucketSession(t.session);
      bySession.set(b, (bySession.get(b) ?? 0) + t.profit);
    }
    let bestSession = "—";
    let bestV = -Infinity;
    if (bySession.size > 0) {
      for (const [k, v] of bySession) {
        if (v > bestV) {
          bestV = v;
          bestSession = k;
        }
      }
    }

    return { total, winRate, totalProfit, bestSession };
  }, [trades]);

  const lineData = useMemo(
    () => cumulativeSeries(filterByRange(trades, chartRange)),
    [trades, chartRange],
  );

  const barData = useMemo(() => sessionTotals(trades), [trades]);

  const card =
    "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-inner shadow-black/20";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded bg-zinc-800" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${card} h-24`} />
          ))}
        </div>
        <div className={`${card} h-56`} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-zinc-100">Analytics</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400"
        >
          Refresh
        </button>
      </div>

      {err && (
        <p className="rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {err}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Total trades"
          value={String(metrics.total)}
          delay={0}
        />
        <Metric
          label="Win rate"
          value={`${metrics.winRate}%`}
          delay={0.05}
        />
        <Metric
          label="Total P/L"
          value={formatUsd(metrics.totalProfit)}
          accent={metrics.totalProfit >= 0 ? "up" : "down"}
          delay={0.1}
        />
        <Metric
          label="Best session"
          value={metrics.bestSession}
          delay={0.15}
        />
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-300">Profit over time</p>
          <div className="flex gap-1 rounded-lg bg-zinc-950 p-1 ring-1 ring-zinc-800">
            {(
              [
                ["1d", "1 Day"],
                ["7d", "7 Days"],
                ["30d", "1 Month"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setChartRange(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  chartRange === k
                    ? "bg-[#9100f2] text-white"
                    : "text-zinc-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-52 w-full min-w-0">
          {lineData.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">
              No trades in this range.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value) => [
                    typeof value === "number" ? formatUsd(value) : String(value ?? ""),
                    "Cumulative",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#9100f2"
                  strokeWidth={2}
                  dot={{ fill: "#9100f2", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={card}>
        <p className="text-sm font-medium text-zinc-300">Session performance</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Total P/L by session (all time)
        </p>
        <div className="mt-4 h-48 w-full min-w-0">
          {barData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No trades yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  formatter={(value) =>
                    typeof value === "number" ? formatUsd(value) : String(value ?? "")
                  }
                />
                <Bar dataKey="total" fill="#9100f2" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={card}>
        <p className="text-sm font-medium text-zinc-300">Recent trades</p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {trades.slice(0, 12).map((t) => (
            <li
              key={t._id}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                t.isWin
                  ? "bg-emerald-950/35 text-emerald-100"
                  : "bg-rose-950/35 text-rose-100"
              }`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-mono text-xs text-zinc-300">
                  {t.pair} · {t.side}
                </span>
                <span className="truncate text-xs text-zinc-500">
                  {t.session} {t.mood ? ` ${t.mood}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs font-semibold">
                {t.profit >= 0 ? "+" : ""}
                {formatUsd(t.profit)}
              </span>
            </li>
          ))}
          {trades.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-500">
              Log your first trade in Add Trade.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  delay,
}: {
  label: string;
  value: string;
  accent?: "up" | "down";
  delay: number;
}) {
  const color =
    accent === "up"
      ? "text-emerald-400"
      : accent === "down"
        ? "text-rose-400"
        : "text-zinc-100";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-inner shadow-black/20"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </motion.div>
  );
}
