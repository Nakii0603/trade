export type Side = "BUY" | "SELL";

/** Approximate USD P/L per $1 price move per 1.0 lot (broker-dependent; good for journaling). */
function pairMultiplier(pair: string): number {
  const p = pair.toUpperCase();
  if (p.includes("XAU") || p.includes("GOLD")) return 100;
  if (p.includes("XAG") || p.includes("SILVER")) return 5000;
  return 100;
}

export function computeProfitUsd(
  pair: string,
  side: Side,
  entry: number,
  exitPrice: number,
  lot: number,
): number {
  const diff = side === "BUY" ? exitPrice - entry : entry - exitPrice;
  const mult = pairMultiplier(pair);
  const raw = diff * lot * mult;
  return Math.round(raw * 100) / 100;
}

export function isWinningTrade(profit: number): boolean {
  return profit > 0;
}
