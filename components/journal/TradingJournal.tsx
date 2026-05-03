"use client";

import { useState } from "react";
import { AddTradeStepper } from "./AddTradeStepper";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { BottomNav } from "./BottomNav";

type Tab = "add" | "analytics";

export function TradingJournal() {
  const [tab, setTab] = useState<Tab>("add");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">
            Metal Journal
          </h1>
          <p className="text-xs text-zinc-500">
            Gold & silver · fast daily logging
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-28 pt-5">
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
