import { TradingJournal } from "@/components/journal/TradingJournal";
import { HtmlLangSync, LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function Home() {
  return (
    <LanguageProvider>
      <HtmlLangSync />
      <TradingJournal />
    </LanguageProvider>
  );
}
