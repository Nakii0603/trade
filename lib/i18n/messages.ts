export type Locale = "mn" | "en";

export const DEFAULT_LOCALE: Locale = "mn";

export const LOCALE_STORAGE_KEY = "trade_journal_locale";

export type MessageKey =
  | "journalTitle"
  | "journalSubtitle"
  | "navAddTrade"
  | "navAnalytics"
  | "navAria"
  | "apiLoading"
  | "langMn"
  | "langEn"
  | "logTradeTitle"
  | "stepProgress"
  | "accountsHeading"
  | "accountsHint"
  | "yourAccounts"
  | "continue"
  | "close"
  | "addAccount"
  | "newAccount"
  | "accountName"
  | "accountId"
  | "cancel"
  | "save"
  | "noAccountsYet"
  | "noAccountsHint"
  | "placeholderPrimary"
  | "placeholderAccountId"
  | "placeholderAccountIdUnique"
  | "placeholderCustomPair"
  | "add"
  | "sessionHeading"
  | "manualTime"
  | "moodOptional"
  | "lotSize"
  | "direction"
  | "entryPrice"
  | "exitPrice"
  | "pairHeading"
  | "pairGold"
  | "pairSilver"
  | "back"
  | "next"
  | "submit"
  | "saving"
  | "tradeSaved"
  | "errAccountRequired"
  | "errSelectAccount"
  | "errSelectAccountTrade"
  | "errManualTime"
  | "errSelectPair"
  | "errEntryExit"
  | "errLot"
  | "errSaveAccount"
  | "errSaveAccountDb"
  | "errTradeSave"
  | "sessionHoursTokyo"
  | "sessionHoursLondon"
  | "sessionHoursNewYork"
  | "sessionHoursSydney"
  | "sessionTitleTokyo"
  | "sessionTitleLondon"
  | "sessionTitleNewYork"
  | "sessionTitleSydney"
  | "sessionManualPrefix"
  | "analyticsTitle"
  | "refresh"
  | "accountLabel"
  | "allAccounts"
  | "analyticsShowing"
  | "tradeOne"
  | "tradeMany"
  | "analyticsErr"
  | "metricTotalTrades"
  | "metricWinRate"
  | "metricTotalPl"
  | "metricBestSession"
  | "profitOverTime"
  | "range1d"
  | "range7d"
  | "range30d"
  | "range90d"
  | "range180d"
  | "range1y"
  | "rangeAll"
  | "range1dShort"
  | "range7dShort"
  | "range30dShort"
  | "range90dShort"
  | "range180dShort"
  | "range1yShort"
  | "rangeAllShort"
  | "noTradesInRange"
  | "sessionPerformance"
  | "sessionPlAll"
  | "sessionPlSelected"
  | "noTradesYet"
  | "recentTrades"
  | "recentNoFiltered"
  | "recentNoTrades"
  | "chartCumulative"
  | "bucketTokyo"
  | "bucketLondon"
  | "bucketNewYork"
  | "bucketSydney"
  | "bucketOther";

const en: Record<MessageKey, string> = {
  journalTitle: "Metal Journal",
  journalSubtitle: "Gold & silver · fast daily logging",
  navAddTrade: "Add Trade",
  navAnalytics: "Analytics",
  navAria: "Main navigation",
  apiLoading: "Loading…",
  langMn: "MN",
  langEn: "EN",
  logTradeTitle: "Log trade",
  stepProgress: "Step",
  accountsHeading: "Accounts",
  accountsHint:
    "Choose who this trade is for. Account IDs must be unique.",
  yourAccounts: "Your accounts",
  continue: "Continue",
  close: "Close",
  addAccount: "Add Account",
  newAccount: "New account",
  accountName: "Account name",
  accountId: "Account ID",
  cancel: "Cancel",
  save: "Save",
  noAccountsYet: "No accounts yet",
  noAccountsHint: "Add your first account to start the journal.",
  placeholderPrimary: "e.g. Primary",
  placeholderAccountId: "e.g. live-01",
  placeholderAccountIdUnique: "e.g. live-01 (unique)",
  placeholderCustomPair: "Custom (e.g. XAUUSD)",
  add: "Add",
  sessionHeading: "Session",
  manualTime: "Manual time",
  moodOptional: "Mood (optional)",
  lotSize: "Lot size",
  direction: "Direction",
  entryPrice: "Entry price",
  exitPrice: "Exit price",
  pairHeading: "Pair",
  pairGold: "Gold",
  pairSilver: "Silver",
  back: "Back",
  next: "Next",
  submit: "Submit",
  saving: "Saving…",
  tradeSaved: "Trade saved.",
  errAccountRequired: "Account name and account ID are required.",
  errSelectAccount: "Select an account, or add one first.",
  errSelectAccountTrade: "Select an account for this trade.",
  errManualTime: "Pick a time or switch to a preset session.",
  errSelectPair: "Select a pair.",
  errEntryExit: "Enter valid entry and exit prices.",
  errLot: "Enter a valid lot size.",
  errSaveAccount: "Could not save account.",
  errSaveAccountDb: "Could not save account. Check MongoDB connection.",
  errTradeSave: "Save failed",
  sessionHoursTokyo: "08:00 – 17:00 (local)",
  sessionHoursLondon:
    "15:00 – 00:00 (winter) · 16:00 – 01:00 (summer, DST)",
  sessionHoursNewYork:
    "21:00 – 06:00 (winter) · 20:00 – 05:00 (summer, DST)",
  sessionHoursSydney:
    "05:00 – 14:00 (winter) · 04:00 – 13:00 (summer, DST)",
  sessionTitleTokyo: "Tokyo (Asia)",
  sessionTitleLondon: "London",
  sessionTitleNewYork: "New York",
  sessionTitleSydney: "Sydney",
  sessionManualPrefix: "Manual · ",
  analyticsTitle: "Analytics",
  refresh: "Refresh",
  accountLabel: "Account",
  allAccounts: "All accounts",
  analyticsShowing: "Showing",
  tradeOne: "trade",
  tradeMany: "trades",
  analyticsErr: "Check MongoDB is running and MONGODB_URI is set.",
  metricTotalTrades: "Total trades",
  metricWinRate: "Win rate",
  metricTotalPl: "Total P/L",
  metricBestSession: "Best session",
  profitOverTime: "Profit over time",
  range1d: "1 Day",
  range7d: "7 Days",
  range30d: "1 Month",
  range90d: "3 Months",
  range180d: "6 Months",
  range1y: "1 Year",
  rangeAll: "All time",
  range1dShort: "1D",
  range7dShort: "7D",
  range30dShort: "1M",
  range90dShort: "3M",
  range180dShort: "6M",
  range1yShort: "1Y",
  rangeAllShort: "All",
  noTradesInRange: "No trades in this range.",
  sessionPerformance: "Session performance",
  sessionPlAll: "Total P/L by session (all accounts)",
  sessionPlSelected: "Total P/L by session (selected account)",
  noTradesYet: "No trades yet.",
  recentTrades: "Recent trades",
  recentNoFiltered:
    'No trades for this account in the loaded data. Try "All accounts" or add a trade for this account.',
  recentNoTrades: "Log your first trade in Add Trade.",
  chartCumulative: "Cumulative",
  bucketTokyo: "Tokyo (Asia)",
  bucketLondon: "London",
  bucketNewYork: "New York",
  bucketSydney: "Sydney",
  bucketOther: "Other",
};

const mn: Record<MessageKey, string> = {
  journalTitle: "Металлын тэмдэглэл",
  journalSubtitle: "Алт, мөнгө · хурдан өдрийн бүртгэл",
  navAddTrade: "Арилжаа нэмэх",
  navAnalytics: "Шинжилгээ",
  navAria: "Үндсэн цэс",
  apiLoading: "Ачаалж байна…",
  langMn: "МН",
  langEn: "EN",
  logTradeTitle: "Арилжаа бүртгэх",
  stepProgress: "Алхам",
  accountsHeading: "Данснууд",
  accountsHint:
    "Энэ арилжаа хэнд зориулагдсаныг сонгоно уу. Дансны ID давхцахгүй байх ёстой.",
  yourAccounts: "Таны данснууд",
  continue: "Үргэлжлүүлэх",
  close: "Хаах",
  addAccount: "Данс нэмэх",
  newAccount: "Шинэ данс",
  accountName: "Дансны нэр",
  accountId: "Дансны ID",
  cancel: "Цуцлах",
  save: "Хадгалах",
  noAccountsYet: "Данс байхгүй байна",
  noAccountsHint: "Тэмдэглэл эхлүүлэхийн тулд эхний дансаа нэмнэ үү.",
  placeholderPrimary: "Жишээ: Үндсэн",
  placeholderAccountId: "Жишээ: live-01",
  placeholderAccountIdUnique: "Жишээ: live-01 (давхцахгүй)",
  placeholderCustomPair: "Өөрийн хос (жишээ XAUUSD)",
  add: "Нэмэх",
  sessionHeading: "Хуралдааны цаг",
  manualTime: "Гараар цаг оруулах",
  moodOptional: "Сэтгэлийн байдал (сонголттой)",
  lotSize: "Лотын хэмжээ",
  direction: "Чиглэл",
  entryPrice: "Орох үнэ",
  exitPrice: "Гарах үнэ",
  pairHeading: "Хослол",
  pairGold: "Алт",
  pairSilver: "Мөнгө",
  back: "Буцах",
  next: "Дараах",
  submit: "Илгээх",
  saving: "Хадгалж байна…",
  tradeSaved: "Арилжаа хадгалагдлаа.",
  errAccountRequired: "Дансны нэр болон ID заавал оруулна уу.",
  errSelectAccount: "Данс сонгоно уу, эсвэл эхлээд нэгийг нэмнэ үү.",
  errSelectAccountTrade: "Энэ арилжаанд данс сонгоно уу.",
  errManualTime: "Цаг сонгоно уу эсвэл урьдчилсан хуралдаанд шилжинэ үү.",
  errSelectPair: "Хослол сонгоно уу.",
  errEntryExit: "Орох, гарах үнээ зөв оруулна уу.",
  errLot: "Зөв лотын хэмжээ оруулна уу.",
  errSaveAccount: "Данс хадгалагдсангүй.",
  errSaveAccountDb: "Данс хадгалагдсангүй. MongoDB холболтоо шалгана уу.",
  errTradeSave: "Хадгалалт амжилтгүй",
  sessionHoursTokyo: "08:00 – 17:00 (орон нутгийн)",
  sessionHoursLondon:
    "15:00 – 00:00 (өвөл) · 16:00 – 01:00 (зун, DST)",
  sessionHoursNewYork:
    "21:00 – 06:00 (өвөл) · 20:00 – 05:00 (зун, DST)",
  sessionHoursSydney:
    "05:00 – 14:00 (өвөл) · 04:00 – 13:00 (зун, DST)",
  sessionTitleTokyo: "Токио (Ази)",
  sessionTitleLondon: "Лондон",
  sessionTitleNewYork: "Нью-Йорк",
  sessionTitleSydney: "Сидней",
  sessionManualPrefix: "Гараар · ",
  analyticsTitle: "Шинжилгээ",
  refresh: "Шинэчлэх",
  accountLabel: "Данс",
  allAccounts: "Бүх данс",
  analyticsShowing: "Харуулж байна",
  tradeOne: "арилжаа",
  tradeMany: "арилжаа",
  analyticsErr: "MongoDB ажиллаж, MONGODB_URI тохируулсан эсэхийг шалгана уу.",
  metricTotalTrades: "Нийт арилжаа",
  metricWinRate: "Ялалтын хувь",
  metricTotalPl: "Нийт ашиг/алдагдал",
  metricBestSession: "Шилдэг хуралдаан",
  profitOverTime: "Цаг хугацааны ашиг",
  range1d: "1 өдөр",
  range7d: "7 өдөр",
  range30d: "1 сар",
  range90d: "3 сар",
  range180d: "6 сар",
  range1y: "1 жил",
  rangeAll: "Бүх цаг",
  range1dShort: "1Ө",
  range7dShort: "7Ө",
  range30dShort: "1С",
  range90dShort: "3С",
  range180dShort: "6С",
  range1yShort: "1Ж",
  rangeAllShort: "Бүгд",
  noTradesInRange: "Энэ хугацаанд арилжаа алга.",
  sessionPerformance: "Хуралдааны гүйцэтгэл",
  sessionPlAll: "Хуралдаанаар нийт ашиг/алдагдал (бүх данс)",
  sessionPlSelected: "Хуралдаанаар нийт ашиг/алдагдал (сонгосон данс)",
  noTradesYet: "Одоогоор арилжаа алга.",
  recentTrades: "Сүүлийн арилжаанууд",
  recentNoFiltered:
    "Энэ дансанд ачаалсан өгөгдөлд арилжаа алга. «Бүх данс» сонгох эсвэл энэ дансанд арилжаа нэмнэ үү.",
  recentNoTrades: "Эхний арилжаагаа «Арилжаа нэмэх»-ээс бүртгэнэ үү.",
  chartCumulative: "Нийлбэр",
  bucketTokyo: "Токио (Ази)",
  bucketLondon: "Лондон",
  bucketNewYork: "Нью-Йорк",
  bucketSydney: "Сидней",
  bucketOther: "Бусад",
};

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en,
  mn,
};

export function translateSessionBucket(
  locale: Locale,
  bucket: string,
): string {
  const map: Record<string, MessageKey> = {
    "Tokyo (Asia)": "bucketTokyo",
    London: "bucketLondon",
    "New York": "bucketNewYork",
    Sydney: "bucketSydney",
    Other: "bucketOther",
  };
  const key = map[bucket];
  return key ? messages[locale][key] : bucket;
}
