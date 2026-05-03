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
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { translateSessionBucket } from "@/lib/i18n/messages";
import { SESSION_CHART_ORDER, bucketSession } from "@/lib/sessionBucket";
import type { AccountListItem } from "@/types/account";
import type { TradeDTO } from "@/types/trade";

type RangeKey = "1d" | "7d" | "30d" | "90d" | "180d" | "1y" | "all";

const RANGE_MS: Record<Exclude<RangeKey, "all">, number> = {
  "1d": 86400000,
  "7d": 7 * 86400000,
  "30d": 30 * 86400000,
  "90d": 90 * 86400000,
  "180d": 180 * 86400000,
  "1y": 365 * 86400000,
};

const CHART_RANGE_KEYS: {
  key: RangeKey;
  labelKey: MessageKey;
  shortKey: MessageKey;
}[] = [
    { key: "1d", labelKey: "range1d", shortKey: "range1dShort" },
    { key: "7d", labelKey: "range7d", shortKey: "range7dShort" },
    { key: "30d", labelKey: "range30d", shortKey: "range30dShort" },
    { key: "90d", labelKey: "range90d", shortKey: "range90dShort" },
    { key: "180d", labelKey: "range180d", shortKey: "range180dShort" },
    { key: "1y", labelKey: "range1y", shortKey: "range1yShort" },
    { key: "all", labelKey: "rangeAll", shortKey: "rangeAllShort" },
  ];

function formatUsd(n: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function filterByRange(trades: TradeDTO[], key: RangeKey): TradeDTO[] {
  if (key === "all") return [...trades];
  const now = Date.now();
  const from = now - RANGE_MS[key];
  return trades.filter((t) => new Date(t.createdAt).getTime() >= from);
}

function cumulativeSeries(
  trades: TradeDTO[],
  includeYear: boolean,
  intlLocale: string,
) {
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let cum = 0;
  return sorted.map((t, i) => {
    cum += t.profit;
    const d = new Date(t.createdAt);
    return {
      i: i + 1,
      label: d.toLocaleDateString(
        intlLocale,
        includeYear
          ? { month: "short", day: "numeric", year: "2-digit" }
          : { month: "short", day: "numeric" },
      ),
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
  return SESSION_CHART_ORDER.map((name) => ({
    name,
    total: map.get(name) ?? 0,
  }));
}

/** Same logical key as Mongo `accountIdKey` — filters must ignore ID casing/spacing. */
function accountIdentityKey(accountId: string | undefined | null): string {
  return String(accountId ?? "").trim().toLowerCase();
}

function accountDisplayNameKey(name: string | undefined | null): string {
  return String(name ?? "").trim().toLowerCase();
}

function isMissingAccountId(accountId: string): boolean {
  const t = accountId.trim();
  return t === "" || t === "—";
}

/** Select value: `mdb:<Account._id>` or `lid:<normalized account id>`. */
type AnalyticsAccountOption = {
  filterValue: string;
  idKey: string;
  displayId: string;
  accountName: string;
  mongoId?: string;
};

function tradeMatchesSelectedAccount(
  t: TradeDTO,
  selected: AnalyticsAccountOption,
): boolean {
  if (
    !isMissingAccountId(t.accountId) &&
    accountIdentityKey(t.accountId) === selected.idKey
  ) {
    return true;
  }
  if (
    isMissingAccountId(t.accountId) &&
    accountDisplayNameKey(t.accountName) ===
      accountDisplayNameKey(selected.accountName) &&
    accountDisplayNameKey(t.accountName) !== ""
  ) {
    return true;
  }
  if (
    !isMissingAccountId(t.accountName) &&
    accountIdentityKey(t.accountName) === selected.idKey
  ) {
    return true;
  }
  if (
    accountDisplayNameKey(t.accountName) ===
      accountDisplayNameKey(selected.accountName) &&
    accountDisplayNameKey(t.accountName) !== ""
  ) {
    return true;
  }
  return false;
}

function parseAccountFilterValue(
  raw: string,
):
  | { mode: "all" }
  | { mode: "mongo"; mongoId: string }
  | { mode: "lid"; idKey: string } {
  const v = raw.trim();
  if (!v) return { mode: "all" };
  if (v.startsWith("mdb:")) {
    const mongoId = v.slice(4).trim();
    return mongoId ? { mode: "mongo", mongoId } : { mode: "all" };
  }
  if (v.startsWith("lid:")) {
    const idKey = v.slice(4).trim();
    return idKey ? { mode: "lid", idKey } : { mode: "all" };
  }
  return { mode: "lid", idKey: accountIdentityKey(v) };
}

function mergeAccountOptions(
  api: AccountListItem[],
  trades: TradeDTO[],
): AnalyticsAccountOption[] {
  const byKey = new Map<
    string,
    { displayId: string; accountName: string; mongoId?: string }
  >();
  for (const a of api) {
    if (isMissingAccountId(a.accountId)) continue;
    const idKey = accountIdentityKey(a.accountId);
    const displayId = a.accountId.trim();
    const name = a.accountName.trim() || displayId;
    const mongoId =
      typeof a._id === "string" && a._id.trim() !== "" ? a._id.trim() : undefined;
    byKey.set(idKey, { displayId, accountName: name, mongoId });
  }
  for (const t of trades) {
    if (isMissingAccountId(t.accountId)) continue;
    const idKey = accountIdentityKey(t.accountId);
    if (byKey.has(idKey)) continue;
    const displayId = t.accountId.trim();
    byKey.set(idKey, {
      displayId,
      accountName: t.accountName.trim() || displayId,
    });
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([idKey, row]) => ({
      idKey,
      displayId: row.displayId,
      accountName: row.accountName,
      mongoId: row.mongoId,
      filterValue: row.mongoId ? `mdb:${row.mongoId}` : `lid:${idKey}`,
    }));
}

export function AnalyticsPanel({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const { locale, t: tr, intlLocale } = useLanguage();
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [accountRows, setAccountRows] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<RangeKey>("7d");
  const [accountFilter, setAccountFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [tradesRes, accountsRes] = await Promise.all([
        fetch("/api/trades"),
        fetch("/api/accounts"),
      ]);
      if (!tradesRes.ok) throw new Error("Could not load trades");
      const data = (await tradesRes.json()) as TradeDTO[];
      setTrades(Array.isArray(data) ? data : []);
      if (accountsRes.ok) {
        const rows = (await accountsRes.json()) as AccountListItem[];
        setAccountRows(Array.isArray(rows) ? rows : []);
      } else {
        setAccountRows([]);
      }
    } catch {
      setErr(tr("analyticsErr"));
      setTrades([]);
      setAccountRows([]);
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / refreshKey
    void load();
  }, [load, refreshKey]);

  const accountOptions = useMemo(
    () => mergeAccountOptions(accountRows, trades),
    [accountRows, trades],
  );

  useEffect(() => {
    if (
      accountFilter &&
      !accountOptions.some((o) => o.filterValue === accountFilter)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale filter when options shrink
      setAccountFilter("");
    }
  }, [accountFilter, accountOptions]);

  const filteredTrades = useMemo(() => {
    const parsed = parseAccountFilterValue(accountFilter);
    if (parsed.mode === "all") return trades;

    const selected = accountOptions.find(
      (o) => o.filterValue === accountFilter,
    );

    if (parsed.mode === "mongo") {
      const { mongoId } = parsed;
      return trades.filter((t) => {
        if (t.accountRef === mongoId) return true;
        if (selected) return tradeMatchesSelectedAccount(t, selected);
        return false;
      });
    }

    const idKey = parsed.idKey;
    const sel =
      selected ?? accountOptions.find((o) => o.idKey === idKey) ?? null;
    if (!sel) return [];
    return trades.filter((t) => tradeMatchesSelectedAccount(t, sel));
  }, [trades, accountFilter, accountOptions]);

  const metrics = useMemo(() => {
    const total = filteredTrades.length;
    const wins = filteredTrades.filter((t) => t.isWin).length;
    const winRate = total ? Math.round((wins / total) * 1000) / 10 : 0;
    const totalProfit =
      Math.round(filteredTrades.reduce((s, t) => s + t.profit, 0) * 100) /
      100;
    const bySession = new Map<string, number>();
    for (const t of filteredTrades) {
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
  }, [filteredTrades]);

  const chartRangeOptions = useMemo(
    () =>
      CHART_RANGE_KEYS.map((row) => ({
        key: row.key,
        label: tr(row.labelKey),
        short: tr(row.shortKey),
      })),
    [tr],
  );

  const lineData = useMemo(() => {
    const filtered = filterByRange(filteredTrades, chartRange);
    const includeYear =
      chartRange === "90d" ||
      chartRange === "180d" ||
      chartRange === "1y" ||
      chartRange === "all";
    return cumulativeSeries(filtered, includeYear, intlLocale);
  }, [filteredTrades, chartRange, intlLocale]);

  const barData = useMemo(() => {
    const raw = sessionTotals(filteredTrades);
    return raw.map((row) => ({
      name: translateSessionBucket(locale, row.name),
      total: row.total,
    }));
  }, [filteredTrades, locale]);

  const bestSessionLabel = useMemo(() => {
    const b = metrics.bestSession;
    if (b === "—") return b;
    return translateSessionBucket(locale, b);
  }, [metrics.bestSession, locale]);

  const accountSelectLabel = accountFilter
    ? accountOptions.find((o) => o.filterValue === accountFilter)
        ?.accountName ?? accountFilter
    : null;

  const card =
    "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-inner shadow-black/20 sm:p-5 lg:p-6";

  if (loading) {
    return (
      <div className="min-w-0 space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded bg-zinc-800 sm:h-9 sm:w-48" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${card} h-24 lg:h-28`} />
          ))}
        </div>
        <div className={`${card} h-56 sm:h-64 lg:h-72`} />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
          {tr("analyticsTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 sm:flex-initial sm:min-w-[12rem]">
            <select
              aria-label={tr("accountLabel")}
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="tap-target w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-600 focus:ring-2 sm:min-w-[14rem]"
            >
              <option value="">{tr("allAccounts")}</option>
              {accountOptions.map((a) => (
                <option key={a.filterValue} value={a.filterValue}>
                  {a.accountName} ({a.displayId})
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full items-end justify-end sm:w-auto sm:pb-0.5">
            <button
              type="button"
              onClick={() => void load()}
              className="tap-target rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 sm:px-4 sm:text-sm"
            >
              {tr("refresh")}
            </button>
          </div>
        </div>
      </div>

      {accountSelectLabel && (
        <p className="px-1 text-xs text-zinc-500">
          {tr("analyticsShowing")}{" "}
          <span className="font-medium text-zinc-400">{accountSelectLabel}</span>{" "}
          · {filteredTrades.length}{" "}
          {filteredTrades.length === 1 ? tr("tradeOne") : tr("tradeMany")}
        </p>
      )}

      {err && (
        <p className="rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {err}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Metric
          label={tr("metricTotalTrades")}
          value={String(metrics.total)}
          delay={0}
        />
        <Metric
          label={tr("metricWinRate")}
          value={`${metrics.winRate}%`}
          delay={0.05}
        />
        <Metric
          label={tr("metricTotalPl")}
          value={formatUsd(metrics.totalProfit, intlLocale)}
          accent={metrics.totalProfit >= 0 ? "up" : "down"}
          delay={0.1}
        />
        <Metric
          label={tr("metricBestSession")}
          value={bestSessionLabel}
          delay={0.15}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-4">
        <div className={card}>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-zinc-300 sm:text-base">
              {tr("profitOverTime")}
            </p>
            <div className="flex max-w-full flex-wrap gap-1 rounded-lg bg-zinc-950 p-1 ring-1 ring-zinc-800">
              {chartRangeOptions.map(({ key, label, short }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => setChartRange(key)}
                  className={`tap-target rounded-md px-2.5 py-2 text-xs font-medium transition sm:px-3 sm:py-1.5 ${
                    chartRange === key
                      ? "bg-[#9100f2] text-white"
                      : "text-zinc-500"
                  }`}
                >
                  <span className="md:hidden">{short}</span>
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-52 w-full min-w-0 sm:h-56 md:h-64 lg:h-72">
          {lineData.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">
              {tr("noTradesInRange")}
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
                    typeof value === "number"
                      ? formatUsd(value, intlLocale)
                      : String(value ?? ""),
                    tr("chartCumulative"),
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
          <p className="text-sm font-medium text-zinc-300 sm:text-base">
            {tr("sessionPerformance")}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
            {accountFilter ? tr("sessionPlSelected") : tr("sessionPlAll")}
          </p>
          <div className="mt-4 h-48 w-full min-w-0 sm:h-52 md:h-56 lg:h-72">
          {barData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              {tr("noTradesYet")}
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
                  width={locale === "mn" ? 128 : 104}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatUsd(value, intlLocale)
                      : String(value ?? "")
                  }
                />
                <Bar dataKey="total" fill="#9100f2" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>

        <div className={`${card} lg:col-span-2`}>
          <p className="text-sm font-medium text-zinc-300 sm:text-base">
            {tr("recentTrades")}
          </p>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto overflow-x-hidden pr-1 sm:max-h-72 lg:max-h-[28rem]">
          {filteredTrades.slice(0, 12).map((trade) => (
            <li
              key={trade._id}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                trade.isWin
                  ? "bg-emerald-950/35 text-emerald-100"
                  : "bg-rose-950/35 text-rose-100"
              }`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-xs font-medium text-zinc-400">
                  <span className="font-mono text-zinc-300">
                    {trade.accountId}
                  </span>
                  <span className="text-zinc-600"> · </span>
                  {trade.accountName}
                </span>
                <span className="truncate font-mono text-xs text-zinc-300">
                  {trade.pair} · {trade.side}
                </span>
                <span className="truncate text-xs text-zinc-500">
                  {trade.session} {trade.mood ? ` ${trade.mood}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs font-semibold">
                {trade.profit >= 0 ? "+" : ""}
                {formatUsd(trade.profit, intlLocale)}
              </span>
            </li>
          ))}
          {filteredTrades.length === 0 && trades.length > 0 && (
            <li className="py-8 text-center text-sm text-zinc-500">
              {tr("recentNoFiltered")}
            </li>
          )}
          {trades.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-500">
              {tr("recentNoTrades")}
            </li>
          )}
          </ul>
        </div>
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
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-inner shadow-black/20 sm:p-5"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl lg:text-3xl ${color}`}
      >
        {value}
      </p>
    </motion.div>
  );
}
