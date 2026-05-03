"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Side } from "@/types/trade";

const PRESETS = ["Asia", "London", "New York"] as const;
const DEFAULT_PAIRS: { label: string; value: string }[] = [
  { label: "Gold", value: "XAUUSD" },
  { label: "Silver", value: "XAGUSD" },
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

export function AddTradeStepper({ onSaved }: { onSaved: () => void }) {
  const [step, setStep] = useState(1);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate custom pairs from localStorage once
    setExtraPairs(loadExtraPairs());
  }, []);

  const sessionValue = useMemo(() => {
    if (useManualSession && manualTime) {
      const d = new Date(manualTime);
      return `Manual · ${d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return sessionPreset;
  }, [useManualSession, manualTime, sessionPreset]);

  const reset = useCallback(() => {
    setStep(1);
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
  }, []);

  const addCustomPair = () => {
    const v = customPairInput.trim().toUpperCase();
    if (!v) return;
    const next = [...new Set([...extraPairs, v])];
    setExtraPairs(next);
    saveExtraPairs(next);
    setPair(v);
    setCustomPairInput("");
  };

  const goNext = () => {
    setError(null);
    if (step === 1 && useManualSession && !manualTime) {
      setError("Pick a time or switch to a preset session.");
      return;
    }
    if (step === 2 && !pair) {
      setError("Select a pair.");
      return;
    }
    if (step === 3) {
      const en = Number(entry);
      const ex = Number(exit);
      if (!Number.isFinite(en) || !Number.isFinite(ex)) {
        setError("Enter valid entry and exit prices.");
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const submit = async () => {
    setError(null);
    const lotN = Number(lot);
    if (!Number.isFinite(lotN) || lotN <= 0) {
      setError("Enter a valid lot size.");
      return;
    }
    const en = Number(entry);
    const ex = Number(exit);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        throw new Error((j as { error?: string }).error || "Save failed");
      }
      setSuccess(true);
      onSaved();
      setTimeout(() => {
        reset();
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20";

  const primaryBtn =
    "flex h-14 items-center justify-center rounded-xl bg-[#9100f2] text-base font-semibold text-white transition hover:bg-[#7d00d4] active:scale-[0.99] disabled:opacity-50";

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          Log trade
        </h2>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Step {step} / 4
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#9100f2]" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <div className={`${cardClass} min-h-[280px]`}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-zinc-400">Session</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={useManualSession}
                    onClick={() => {
                      setSessionPreset(s);
                      setUseManualSession(false);
                    }}
                    className={`h-12 rounded-xl border text-sm font-medium transition ${
                      !useManualSession && sessionPreset === s
                        ? "border-[#9100f2] bg-[#9100f2]/15 text-[#e0b3ff]"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300"
                    } disabled:opacity-40`}
                  >
                    {s}
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
                Manual time
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

          {step === 2 && (
            <motion.div
              key="s2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-zinc-400">Pair</p>
              <div className="mt-3 space-y-2">
                {DEFAULT_PAIRS.map((p) => (
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
                    <span className="font-medium text-zinc-100">{p.label}</span>
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
                  placeholder="Custom (e.g. XAUUSD)"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={addCustomPair}
                  className="h-12 shrink-0 rounded-xl border border-zinc-600 px-4 text-sm font-medium text-zinc-200"
                >
                  Add
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-zinc-400">Direction</p>
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
                Entry price
                <input
                  inputMode="decimal"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-zinc-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-400">
                Exit price
                <input
                  inputMode="decimal"
                  value={exit}
                  onChange={(e) => setExit(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-zinc-100"
                />
              </label>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm text-zinc-400">
                Lot size
                <input
                  inputMode="decimal"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-zinc-100"
                />
              </label>
              <p className="mt-4 text-sm text-zinc-400">Mood (optional)</p>
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
          <p className="mt-3 text-sm text-emerald-400">Trade saved.</p>
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
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className={`${primaryBtn} ${step > 1 ? "flex-[2]" : "w-full"}`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className={`${primaryBtn} flex-[2]`}
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
