"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SHELL, SHELL_PAD_X } from "@/lib/layoutShell";

type Tab = "add" | "analytics";

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const { t } = useLanguage();
  const btn =
    "tap-target flex flex-1 flex-col items-center justify-center gap-0.5 py-3.5 text-sm font-medium transition-colors active:scale-[0.98] sm:py-4 lg:text-base";
  const activeCls = "text-[#c77dff]";
  const idleCls = "text-zinc-500";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md safe-area-pb lg:border-x-0 lg:bg-zinc-950/90"
      aria-label={t("navAria")}
    >
      <div
        className={`${SHELL} ${SHELL_PAD_X} flex lg:rounded-t-2xl lg:border-x lg:border-t lg:border-zinc-800/80 lg:bg-zinc-950/95 lg:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]`}
      >
        <button
          type="button"
          className={`${btn} ${active === "add" ? activeCls : idleCls}`}
          onClick={() => onChange("add")}
        >
          <span className="text-xl" aria-hidden>
            ✎
          </span>
          {t("navAddTrade")}
        </button>
        <button
          type="button"
          className={`${btn} ${active === "analytics" ? activeCls : idleCls}`}
          onClick={() => onChange("analytics")}
        >
          <span className="text-xl" aria-hidden>
            ◎
          </span>
          {t("navAnalytics")}
        </button>
      </div>
    </nav>
  );
}
