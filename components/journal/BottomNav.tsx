"use client";

type Tab = "add" | "analytics";

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const btn =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-sm font-medium transition-colors active:scale-[0.98]";
  const activeCls = "text-[#c77dff]";
  const idleCls = "text-zinc-500";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md safe-area-pb"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg">
        <button
          type="button"
          className={`${btn} ${active === "add" ? activeCls : idleCls}`}
          onClick={() => onChange("add")}
        >
          <span className="text-xl" aria-hidden>
            ✎
          </span>
          Add Trade
        </button>
        <button
          type="button"
          className={`${btn} ${active === "analytics" ? activeCls : idleCls}`}
          onClick={() => onChange("analytics")}
        >
          <span className="text-xl" aria-hidden>
            ◎
          </span>
          Analytics
        </button>
      </div>
    </nav>
  );
}
