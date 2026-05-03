"use client";

import { SHELL, SHELL_PAD_X } from "@/lib/layoutShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";
import { AddTradeStepper } from "./AddTradeStepper";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { BottomNav } from "./BottomNav";
import { LanguageToggle } from "./LanguageToggle";

type Tab = "add" | "analytics";

export function TradingJournal() {
  const [tab, setTab] = useState<Tab>("add");
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useLanguage();

  return (
    <div className="flex min-h-dvh min-h-[100dvh] flex-col bg-zinc-950 text-zinc-100">
      <header className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div
          className={`${SHELL} ${SHELL_PAD_X} flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:py-5`}
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
              {t("journalTitle")}
            </h1>
            <p className="text-xs text-zinc-500 sm:text-sm">
              {t("journalSubtitle")}
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-auto">
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main
        className={`${SHELL} ${SHELL_PAD_X} flex-1 overflow-y-auto overflow-x-hidden pb-28 pt-5 sm:pb-32 sm:pt-6 lg:pb-40 lg:pt-8`}
      >
        {tab === "add" ? (
          <AddTradeStepper
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <AnalyticsPanel refreshKey={refreshKey} />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
