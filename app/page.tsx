import { ApiLoadingOverlayProvider } from "@/components/ApiLoadingOverlayProvider";
import { TradingJournal } from "@/components/journal/TradingJournal";
import { HtmlLangSync, LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function Home() {
  return (
    <LanguageProvider>
      <ApiLoadingOverlayProvider>
        <HtmlLangSync />
        <TradingJournal />
      </ApiLoadingOverlayProvider>
    </LanguageProvider>
  );
}
