"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Side } from "@/types/trade";

/** `storageId` is persisted on the trade; labels come from i18n keys. */
const SESSION_PRESET_DEFS: readonly {
  storageId: string;
  emoji: string;
  titleKey: MessageKey;
  hoursKey: MessageKey;
}[] = [
  {
    storageId: "Tokyo (Asia)",
    emoji: "🟣",
    titleKey: "sessionTitleTokyo",
    hoursKey: "sessionHoursTokyo",
  },
  {
    storageId: "London",
    emoji: "🔵",
    titleKey: "sessionTitleLondon",
    hoursKey: "sessionHoursLondon",
  },
  {
    storageId: "New York",
    emoji: "🟠",
    titleKey: "sessionTitleNewYork",
    hoursKey: "sessionHoursNewYork",
  },
  {
    storageId: "Sydney",
    emoji: "🟡",
    titleKey: "sessionTitleSydney",
    hoursKey: "sessionHoursSydney",
  },
];

const PAIR_ROWS: readonly { value: string; labelKey: MessageKey }[] = [
  { value: "XAUUSD", labelKey: "pairGold" },
  { value: "XAGUSD", labelKey: "pairSilver" },
];

const PAIRS_KEY = "trade_journal_pairs";

function loadExtraPairs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAIRS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function saveExtraPairs(pairs: string[]) {
  localStorage.setItem(PAIRS_KEY, JSON.stringify(pairs));
}

type SavedAccount = { _id?: string; accountId: string; accountName: string };

/** Legacy browser storage — migrated once into MongoDB when API list is empty. */
const SAVED_ACCOUNTS_KEY = "trade_journal_saved_accounts_v1";

function parseSavedAccounts(raw: unknown): SavedAccount[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedAccount[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.accountId === "string" ? o.accountId.trim() : "";
    const name = typeof o.accountName === "string" ? o.accountName.trim() : "";
    if (id && name) out.push({ accountId: id, accountName: name });
  }
  return out;
}

function loadSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return parseSavedAccounts(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

async function fetchAccountList(): Promise<SavedAccount[]> {
  const res = await fetch("/api/accounts");
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is SavedAccount =>
      row !== null &&
      typeof row === "object" &&
      typeof (row as SavedAccount).accountId === "string" &&
      typeof (row as SavedAccount).accountName === "string" &&
      ((row as SavedAccount)._id === undefined ||
        typeof (row as SavedAccount)._id === "string"),
  );
}

export function AddTradeStepper({ onSaved }: { onSaved: () => void }) {
  const { t, intlLocale } = useLanguage();
  const [step, setStep] = useState(1);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  /** Lowercase account ID key for the trade + dropdown. */
  const [selectedAccountKey, setSelectedAccountKey] = useState<string | null>(
    null,
  );
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addDraftName, setAddDraftName] = useState("");
  const [addDraftId, setAddDraftId] = useState("");
  const [sessionPreset, setSessionPreset] = useState<string>("London");
  const [manualTime, setManualTime] = useState("");
  const [useManualSession, setUseManualSession] = useState(false);
  const [pair, setPair] = useState("XAUUSD");
  const [customPairInput, setCustomPairInput] = useState("");
  const [extraPairs, setExtraPairs] = useState<string[]>([]);
  const [side, setSide] = useState<Side>("BUY");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [lot, setLot] = useState("");
  const [mood, setMood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate pairs + load accounts from API
    setExtraPairs(loadExtraPairs());
    let cancelled = false;
    (async () => {
      try {
        let list = await fetchAccountList();
        if (!cancelled && list.length === 0) {
          const legacy = loadSavedAccounts();
          for (const a of legacy) {
            await fetch("/api/accounts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(a),
            });
          }
          if (!cancelled && legacy.length > 0) {
            list = await fetchAccountList();
            try {
              localStorage.removeItem(SAVED_ACCOUNTS_KEY);
            } catch {
              /* ignore */
            }
          }
        }
        if (cancelled) return;
        setSavedAccounts(list);
        setAddFormOpen(false);
        if (list.length === 1) {
          setSelectedAccountKey(list[0].accountId.trim().toLowerCase());
        } else {
          setSelectedAccountKey(null);
        }
      } catch {
        if (!cancelled) {
          setSavedAccounts([]);
          setSelectedAccountKey(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedAccountKey = useMemo(() => {
    if (!selectedAccountKey) return null;
    return savedAccounts.some(
      (a) => a.accountId.trim().toLowerCase() === selectedAccountKey,
    )
      ? selectedAccountKey
      : null;
  }, [savedAccounts, selectedAccountKey]);

  const tradeAccount = useMemo((): SavedAccount | null => {
    if (!resolvedAccountKey) return null;
    return (
      savedAccounts.find(
        (a) => a.accountId.trim().toLowerCase() === resolvedAccountKey,
      ) ?? null
    );
  }, [savedAccounts, resolvedAccountKey]);

  const canContinueFromAccounts =
    savedAccounts.length > 0 &&
    resolvedAccountKey !== null &&
    tradeAccount !== null;

  const sessionValue = useMemo(() => {
    if (useManualSession && manualTime) {
      const d = new Date(manualTime);
      return `${t("sessionManualPrefix")}${d.toLocaleString(intlLocale, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return sessionPreset;
  }, [useManualSession, manualTime, sessionPreset, t, intlLocale]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(intlLocale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [intlLocale],
  );

  const reset = useCallback(() => {
    setStep(1);
    setAddDraftName("");
    setAddDraftId("");
    setAddFormOpen(false);
    setSessionPreset("London");
    setManualTime("");
    setUseManualSession(false);
    setPair("XAUUSD");
    setCustomPairInput("");
    setSide("BUY");
    setEntry("");
    setExit("");
    setLot("");
    setMood("");
    setError(null);
    setSuccess(false);
    setSelectedAccountKey((prev) => {
      if (savedAccounts.length === 0) return null;
      if (savedAccounts.length === 1) {
        return savedAccounts[0].accountId.trim().toLowerCase();
      }
      if (
        prev &&
        savedAccounts.some(
          (a) => a.accountId.trim().toLowerCase() === prev,
        )
      ) {
        return prev;
      }
      return null;
    });
  }, [savedAccounts]);

  const addCustomPair = () => {
    const v = customPairInput.trim().toUpperCase();
    if (!v) return;
    const next = [...new Set([...extraPairs, v])];
    setExtraPairs(next);
    saveExtraPairs(next);
    setPair(v);
    setCustomPairInput("");
  };

  const saveFromAddDraft = async () => {
    setError(null);
    const id = addDraftId.trim();
    const name = addDraftName.trim();
    if (!id || !name) {
      setError(t("errAccountRequired"));
      return;
    }
    const key = id.toLowerCase();
    const existing = savedAccounts.find(
      (a) => a.accountId.trim().toLowerCase() === key,
    );
    if (
      existing &&
      existing.accountName.trim() === name.trim() &&
      existing.accountId.trim() === id.trim()
    ) {
      setSelectedAccountKey(key);
      setAddDraftName("");
      setAddDraftId("");
      setAddFormOpen(false);
      return;
    }
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: id, accountName: name }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error || t("errSaveAccount"));
        return;
      }
      const list = await fetchAccountList();
      setSavedAccounts(list);
      setSelectedAccountKey(key);
      setAddDraftName("");
      setAddDraftId("");
      setAddFormOpen(false);
    } catch {
      setError(t("errSaveAccountDb"));
    }
  };

  const cancelAddForm = () => {
    setAddDraftName("");
    setAddDraftId("");
    setAddFormOpen(false);
    setError(null);
  };

  const goNext = () => {
    setError(null);
    if (step === 1 && !tradeAccount) {
      setError(t("errSelectAccount"));
      return;
    }
    if (step === 2) {
      if (!tradeAccount) {
        setError(t("errSelectAccountTrade"));
        return;
      }
      if (useManualSession && !manualTime) {
        setError(t("errManualTime"));
        return;
      }
    }
    if (step === 3 && !pair) {
      setError(t("errSelectPair"));
      return;
    }
    if (step === 4) {
      const en = Number(entry);
      const ex = Number(exit);
      if (!Number.isFinite(en) || !Number.isFinite(ex)) {
        setError(t("errEntryExit"));
        return;
      }
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const submit = async () => {
    setError(null);
    const lotN = Number(lot);
    if (!Number.isFinite(lotN) || lotN <= 0) {
      setError(t("errLot"));
      return;
    }
    const en = Number(entry);
    const ex = Number(exit);
    setSubmitting(true);
    try {
      const acct = tradeAccount;
      if (!acct) {
        setError(t("errSelectAccountTrade"));
        setSubmitting(false);
        return;
      }
      const mongoId =
        typeof acct._id === "string" && acct._id.trim() ? acct._id.trim() : "";
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mongoId ? { accountMongoId: mongoId } : {}),
          accountId: acct.accountId.trim(),
          accountName: acct.accountName.trim(),
          session: sessionValue,
          pair,
          side,
          entry: en,
          exit: ex,
          lot: lotN,
          mood: mood || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || t("errTradeSave"));
      }
      setSuccess(true);
      onSaved();
      setTimeout(() => {
        reset();
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errTradeSave"));
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20 sm:p-6 lg:p-8";

  const primaryBtn =
    "tap-target flex h-14 items-center justify-center rounded-xl bg-[#9100f2] text-base font-semibold text-white transition hover:bg-[#7d00d4] active:scale-[0.99] disabled:opacity-50 sm:h-[3.75rem] lg:text-lg";

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">
          {t("logTradeTitle")}
        </h2>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {t("stepProgress")} {step} / 5
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#9100f2]" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <div className={`${cardClass} min-h-[380px] sm:min-h-[360px] lg:min-h-[340px]`}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s-account"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-zinc-400">{t("accountsHeading")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("accountsHint")}</p>

              {savedAccounts.length > 0 ? (
                <>
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {t("yourAccounts")}
                    </p>
                    <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
                      {savedAccounts.map((a) => {
                        const key = a.accountId.trim().toLowerCase();
                        const active = selectedAccountKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedAccountKey(key);
                              setError(null);
                            }}
                            className={`tap-target flex flex-col gap-0.5 rounded-xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-[#9100f2] bg-[#9100f2]/15 ring-1 ring-[#9100f2]/40"
                                : "border-zinc-700 bg-zinc-950"
                            }`}
                          >
                            <span className="text-sm font-semibold text-zinc-100">
                              {a.accountName}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-500">
                              {a.accountId}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canContinueFromAccounts}
                    className={`${primaryBtn} mt-4 w-full`}
                  >
                    {t("continue")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (addFormOpen) cancelAddForm();
                      else {
                        setAddFormOpen(true);
                        setError(null);
                      }
                    }}
                    className="tap-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-600 bg-zinc-950/80 py-3.5 text-sm font-semibold text-[#c77dff] transition hover:border-[#9100f2]/50 hover:bg-zinc-900"
                    aria-expanded={addFormOpen}
                  >
                    <span className="text-lg leading-none">+</span>
                    {addFormOpen ? t("close") : t("addAccount")}
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      addFormOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          {t("newAccount")}
                        </p>
                        <label className="mt-3 block text-sm text-zinc-400">
                          {t("accountName")}
                          <input
                            value={addDraftName}
                            onChange={(e) => setAddDraftName(e.target.value)}
                            placeholder={t("placeholderPrimary")}
                            maxLength={120}
                            autoComplete="off"
                            className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600"
                          />
                        </label>
                        <label className="mt-3 block text-sm text-zinc-400">
                          {t("accountId")}
                          <input
                            value={addDraftId}
                            onChange={(e) => setAddDraftId(e.target.value)}
                            placeholder={t("placeholderAccountIdUnique")}
                            maxLength={64}
                            autoComplete="off"
                            className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
                          />
                        </label>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={cancelAddForm}
                            className="tap-target h-11 flex-1 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-300"
                          >
                            {t("cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveFromAddDraft()}
                            className="tap-target h-11 flex-[2] rounded-xl bg-[#9100f2] text-sm font-semibold text-white hover:bg-[#7d00d4]"
                          >
                            {t("save")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-center text-sm text-zinc-400">
                    {t("noAccountsYet")}
                  </p>
                  <p className="mt-1 text-center text-xs text-zinc-600">
                    {t("noAccountsHint")}
                  </p>
                  <label className="mt-4 block text-sm text-zinc-400">
                    {t("accountName")}
                    <input
                      value={addDraftName}
                      onChange={(e) => setAddDraftName(e.target.value)}
                      placeholder={t("placeholderPrimary")}
                      maxLength={120}
                      autoComplete="off"
                      className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600"
                    />
                  </label>
                  <label className="mt-3 block text-sm text-zinc-400">
                    {t("accountId")}
                    <input
                      value={addDraftId}
                      onChange={(e) => setAddDraftId(e.target.value)}
                      placeholder={t("placeholderAccountId")}
                      maxLength={64}
                      autoComplete="off"
                      className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void saveFromAddDraft()}
                    className="tap-target mt-4 h-12 w-full rounded-xl bg-[#9100f2] text-sm font-semibold text-white hover:bg-[#7d00d4]"
                  >
                    {t("addAccount")}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s-session"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-zinc-400">{t("sessionHeading")}</p>
                <p className="text-xs text-zinc-500">{todayLabel}</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3">
                {SESSION_PRESET_DEFS.map((s) => (
                  <button
                    key={s.storageId}
                    type="button"
                    disabled={useManualSession}
                    onClick={() => {
                      setSessionPreset(s.storageId);
                      setUseManualSession(false);
                    }}
                    className={`tap-target flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition sm:min-h-[5.5rem] ${
                      !useManualSession && sessionPreset === s.storageId
                        ? "border-[#9100f2] bg-[#9100f2]/15 text-[#e0b3ff]"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300"
                    } disabled:opacity-40`}
                  >
                    <span className="text-sm font-semibold">
                      <span className="mr-2" aria-hidden>
                        {s.emoji}
                      </span>
                      {t(s.titleKey)}
                    </span>
                    <span className="text-[11px] leading-snug text-zinc-500">
                      {t(s.hoursKey)}
                    </span>
                  </button>
                ))}
              </div>
              <label className="mt-5 flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={useManualSession}
                  onChange={(e) => setUseManualSession(e.target.checked)}
                  className="size-4 accent-[#9100f2]"
                />
                {t("manualTime")}
              </label>
              {useManualSession && (
                <input
                  type="datetime-local"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="mt-3 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-zinc-100"
                />
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s-pair"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-zinc-400">{t("pairHeading")}</p>
              <div className="mt-3 space-y-2">
                {PAIR_ROWS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPair(p.value)}
                    className={`flex h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition ${
                      pair === p.value
                        ? "border-[#9100f2] bg-[#9100f2]/15"
                        : "border-zinc-700 bg-zinc-950"
                    }`}
                  >
                    <span className="font-medium text-zinc-100">
                      {t(p.labelKey)}
                    </span>
                    <span className="text-sm text-zinc-500">{p.value}</span>
                  </button>
                ))}
                {extraPairs.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPair(p)}
                    className={`flex h-14 w-full items-center rounded-xl border px-4 text-left font-mono text-sm transition ${
                      pair === p
                        ? "border-[#9100f2] bg-[#9100f2]/15 text-[#e0b3ff]"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={customPairInput}
                  onChange={(e) => setCustomPairInput(e.target.value)}
                  placeholder={t("placeholderCustomPair")}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={addCustomPair}
                  className="h-12 shrink-0 rounded-xl border border-zinc-600 px-4 text-sm font-medium text-zinc-200"
                >
                  {t("add")}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s-prices"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-zinc-400">{t("direction")}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["BUY", "SELL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={`h-12 rounded-xl text-sm font-bold tracking-wide ${
                      side === s
                        ? s === "BUY"
                          ? "bg-emerald-600/30 text-emerald-300 ring-2 ring-emerald-500/50"
                          : "bg-rose-600/30 text-rose-300 ring-2 ring-rose-500/50"
                        : "bg-zinc-950 text-zinc-400 ring-1 ring-zinc-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="mt-5 block text-sm text-zinc-400">
                {t("entryPrice")}
                <input
                  inputMode="decimal"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-zinc-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-400">
                {t("exitPrice")}
                <input
                  inputMode="decimal"
                  value={exit}
                  onChange={(e) => setExit(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-zinc-100"
                />
              </label>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="s-lot"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm text-zinc-400">
                {t("lotSize")}
                <input
                  inputMode="decimal"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-zinc-100"
                />
              </label>
              <p className="mt-4 text-sm text-zinc-400">{t("moodOptional")}</p>
              <div className="mt-2 flex gap-2">
                {["😄", "😐", "😡"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(mood === m ? "" : m)}
                    className={`flex h-14 flex-1 items-center justify-center rounded-xl border text-2xl transition ${
                      mood === m
                        ? "border-[#9100f2] bg-[#9100f2]/20"
                        : "border-zinc-700 bg-zinc-950"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-3 text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-sm text-emerald-400">{t("tradeSaved")}</p>
        )}

        <div className="mt-6 flex w-full gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep((s) => s - 1);
              }}
              className="h-14 flex-1 rounded-xl border border-zinc-600 text-sm font-semibold text-zinc-300"
            >
              {t("back")}
            </button>
          )}
          {step < 5 ? (
            !(step === 1 && savedAccounts.length > 0) && (
              <button
                type="button"
                onClick={goNext}
                disabled={step === 1 && !canContinueFromAccounts}
                className={`${primaryBtn} ${step > 1 ? "flex-[2]" : "w-full"}`}
              >
                {step === 1 ? t("continue") : t("next")}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className={`${primaryBtn} flex-[2]`}
            >
              {submitting ? t("saving") : t("submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
