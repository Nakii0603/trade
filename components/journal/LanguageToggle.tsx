"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/messages";

const pill =
  "tap-target rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-sm";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  const seg = (l: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(l)}
      aria-pressed={locale === l}
      className={`${pill} ${
        locale === l
          ? "bg-[#9100f2] text-white"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="inline-flex rounded-lg bg-zinc-900 p-0.5 ring-1 ring-zinc-800"
      role="group"
      aria-label="Language"
    >
      {seg("mn", t("langMn"))}
      {seg("en", t("langEn"))}
    </div>
  );
}
