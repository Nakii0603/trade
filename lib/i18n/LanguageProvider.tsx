"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  type MessageKey,
  messages,
} from "./messages";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === "en" || v === "mn") return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
  /** BCP 47 tag for `Intl` and `<html lang>`. */
  intlLocale: string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => messages[locale][key] ?? key,
    [locale],
  );

  const intlLocale = locale === "mn" ? "mn-MN" : "en-US";

  const value = useMemo(
    () => ({ locale, setLocale, t, intlLocale }),
    [locale, setLocale, t, intlLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

/** Syncs `document.documentElement.lang` with the active locale. */
export function HtmlLangSync() {
  const { intlLocale } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = intlLocale.startsWith("mn")
      ? "mn"
      : "en";
  }, [intlLocale]);
  return null;
}
