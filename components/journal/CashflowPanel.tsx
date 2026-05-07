"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AccountListItem } from "@/types/account";
import type { CashFlowDTO } from "@/types/cashflow";

type CashFilterKey = "all" | "DEPOSIT" | "WITHDRAWAL";

function formatUsd(n: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function accountIdentityKey(accountId: string | undefined | null): string {
  return String(accountId ?? "").trim().toLowerCase();
}

function mergeAccountOptions(
  api: AccountListItem[],
  rows: CashFlowDTO[],
): { value: string; label: string; idKey: string }[] {
  const map = new Map<string, string>();
  for (const row of api) {
    const id = row.accountId.trim();
    if (!id || id === "—") continue;
    map.set(accountIdentityKey(id), `${row.accountName.trim() || id} (${id})`);
  }
  for (const row of rows) {
    const id = row.accountId.trim();
    if (!id || id === "—") continue;
    const key = accountIdentityKey(id);
    if (!map.has(key)) {
      map.set(key, `${row.accountName.trim() || id} (${id})`);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([idKey, label]) => ({ value: idKey, label, idKey }));
}

export function CashflowPanel({ refreshKey }: { refreshKey: number }) {
  const { t, intlLocale } = useLanguage();
  const [rows, setRows] = useState<CashFlowDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [kind, setKind] = useState<CashFilterKey>("all");
  const [accountFilter, setAccountFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [flowRes, accountRes] = await Promise.all([
        fetch("/api/cashflows"),
        fetch("/api/accounts"),
      ]);
      if (!flowRes.ok) throw new Error("load fail");
      const data = (await flowRes.json()) as CashFlowDTO[];
      setRows(Array.isArray(data) ? data : []);
      if (accountRes.ok) {
        const accountData = (await accountRes.json()) as AccountListItem[];
        setAccounts(Array.isArray(accountData) ? accountData : []);
      } else {
        setAccounts([]);
      }
    } catch {
      setErr(t("analyticsErr"));
      setRows([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / refreshKey
    void load();
  }, [load, refreshKey]);

  const accountOptions = useMemo(
    () => mergeAccountOptions(accounts, rows),
    [accounts, rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (kind !== "all" && row.type !== kind) return false;
      if (!accountFilter) return true;
      if (accountIdentityKey(row.accountId) !== accountFilter) return false;
      return true;
    });
  }, [rows, kind, accountFilter]);

  const dateFilteredRows = useMemo(() => {
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
    return filteredRows.filter((row) => {
      const ts = new Date(row.createdAt).getTime();
      if (!Number.isFinite(ts)) return false;
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [filteredRows, fromDate, toDate]);

  const totals = useMemo(() => {
    let deposit = 0;
    let withdrawal = 0;
    for (const row of dateFilteredRows) {
      if (row.type === "DEPOSIT") deposit += row.amount;
      else withdrawal += row.amount;
    }
    return { deposit, withdrawal, net: withdrawal - deposit };
  }, [dateFilteredRows]);

  const card =
    "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-inner shadow-black/20 sm:p-5 lg:p-6";

  if (loading) {
    return (
      <div className="min-w-0 space-y-4 animate-pulse">
        <div className="h-8 w-44 rounded bg-zinc-800 sm:h-9 sm:w-56" />
        <div className={`${card} h-56`} />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
          {t("cashHistory")}
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="tap-target rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 sm:px-4 sm:text-sm"
        >
          {t("refresh")}
        </button>
      </div>

      {err && (
        <p className="rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {err}
        </p>
      )}

      <div className={card}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex gap-1 rounded-lg bg-zinc-950 p-1 ring-1 ring-zinc-800">
            {(
              [
                { key: "all", label: t("cashAll") },
                { key: "DEPOSIT", label: t("entryDeposit") },
                { key: "WITHDRAWAL", label: t("entryWithdrawal") },
              ] as const
            ).map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => setKind(row.key)}
                className={`tap-target rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  kind === row.key ? "bg-[#9100f2] text-white" : "text-zinc-500"
                }`}
              >
                {row.label}
              </button>
            ))}
          </div>
          <label className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial sm:min-w-[14rem]">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
              {t("accountLabel")}
            </span>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="tap-target rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">{t("allAccounts")}</option>
              {accountOptions.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-[auto_auto_auto] sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                {t("dateFrom")}
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="tap-target rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                {t("dateTo")}
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="tap-target rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="tap-target col-span-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 sm:col-span-1"
            >
              {t("clearDate")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-3 py-2">
            <p className="text-xs text-emerald-300">{t("entryDeposit")}</p>
            <p className="text-lg font-semibold text-emerald-100">
              {formatUsd(totals.deposit, intlLocale)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/25 px-3 py-2">
            <p className="text-xs text-amber-300">{t("entryWithdrawal")}</p>
            <p className="text-lg font-semibold text-amber-100">
              {formatUsd(totals.withdrawal, intlLocale)}
            </p>
          </div>
          <div
            className={`rounded-xl border px-3 py-2 ${
              totals.net >= 0
                ? "border-emerald-900/40 bg-emerald-950/25"
                : "border-rose-900/40 bg-rose-950/25"
            }`}
          >
            <p
              className={`text-xs ${
                totals.net >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {t("metricTotalPl")}
            </p>
            <p
              className={`text-lg font-semibold ${
                totals.net >= 0 ? "text-emerald-100" : "text-rose-100"
              }`}
            >
              {totals.net >= 0 ? "+" : ""}
              {formatUsd(totals.net, intlLocale)}
            </p>
          </div>
        </div>

        <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {dateFilteredRows.slice(0, 50).map((row) => (
            <li
              key={row._id}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                row.type === "DEPOSIT"
                  ? "bg-emerald-950/30 text-emerald-100"
                  : "bg-amber-950/30 text-amber-100"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs text-zinc-400">
                  {row.accountName} ·{" "}
                  {new Date(row.createdAt).toLocaleString(intlLocale)}
                </span>
                <span className="block truncate text-xs text-zinc-500">
                  {row.note?.trim() || t("noNote")}
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm font-semibold">
                {row.type === "DEPOSIT" ? "+" : "-"}
                {formatUsd(row.amount, intlLocale)}
              </span>
            </li>
          ))}
          {dateFilteredRows.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-500">
              {t("cashNoRows")}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
