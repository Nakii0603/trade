"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function pathnameIsAppApi(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/** True when `fetch` hits this app's Route Handlers (`/api/...`). */
function shouldTrackApiFetch(input: RequestInfo | URL): boolean {
  if (typeof input === "string") {
    if (input.startsWith("/")) {
      try {
        return pathnameIsAppApi(new URL(input, "http://_").pathname);
      } catch {
        return false;
      }
    }
    if (typeof window === "undefined") return false;
    try {
      const u = new URL(input, window.location.origin);
      if (u.origin !== window.location.origin) return false;
      return pathnameIsAppApi(u.pathname);
    } catch {
      return false;
    }
  }
  if (input instanceof Request) {
    return shouldTrackApiFetch(input.url);
  }
  try {
    return pathnameIsAppApi(input.pathname);
  } catch {
    return false;
  }
}

export function ApiLoadingOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const w = window;
    const orig = w.fetch.bind(w) as typeof fetch;

    w.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const track = shouldTrackApiFetch(input);
      if (track) setDepth((d) => d + 1);
      return Promise.resolve(orig(input, init)).finally(() => {
        if (track) setDepth((d) => Math.max(0, d - 1));
      });
    }) as typeof fetch;

    return () => {
      w.fetch = orig;
    };
  }, []);

  const show = depth > 0;

  return (
    <>
      {children}
      {show ? (
        <div
          className="fixed inset-0 z-[200] flex cursor-wait flex-col items-center justify-center gap-5 bg-zinc-950/75 backdrop-blur-md"
          aria-busy="true"
          aria-live="polite"
          role="status"
        >
          <span className="sr-only">{t("apiLoading")}</span>
          <div
            className="size-14 rounded-full border-2 border-zinc-700 border-t-[#9100f2] shadow-lg shadow-purple-950/40 animate-spin"
            aria-hidden
          />
          <p className="text-sm font-medium tracking-wide text-zinc-400">
            {t("apiLoading")}
          </p>
        </div>
      ) : null}
    </>
  );
}
