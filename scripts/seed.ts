import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import mongoose from "mongoose";
import { computeProfitUsd, isWinningTrade } from "../lib/profit";
import { Trade } from "../models/Trade";

const samples: Array<{
  session: string;
  pair: string;
  side: "BUY" | "SELL";
  entry: number;
  exit: number;
  lot: number;
  mood: string;
  daysAgo: number;
}> = [
  {
    session: "London",
    pair: "XAUUSD",
    side: "BUY",
    entry: 2320.5,
    exit: 2325.2,
    lot: 0.5,
    mood: "😄",
    daysAgo: 0,
  },
  {
    session: "New York",
    pair: "XAUUSD",
    side: "SELL",
    entry: 2330,
    exit: 2326,
    lot: 0.25,
    mood: "😄",
    daysAgo: 0,
  },
  {
    session: "Asia",
    pair: "XAGUSD",
    side: "BUY",
    entry: 28.4,
    exit: 28.15,
    lot: 0.1,
    mood: "😡",
    daysAgo: 1,
  },
  {
    session: "London",
    pair: "XAUUSD",
    side: "BUY",
    entry: 2310,
    exit: 2305,
    lot: 0.2,
    mood: "😡",
    daysAgo: 2,
  },
  {
    session: "Asia",
    pair: "XAUUSD",
    side: "SELL",
    entry: 2315,
    exit: 2310,
    lot: 0.5,
    mood: "😄",
    daysAgo: 3,
  },
  {
    session: "New York",
    pair: "XAGUSD",
    side: "BUY",
    entry: 29.1,
    exit: 29.45,
    lot: 0.2,
    mood: "😄",
    daysAgo: 4,
  },
  {
    session: "London",
    pair: "XAUUSD",
    side: "BUY",
    entry: 2295,
    exit: 2302,
    lot: 0.3,
    mood: "",
    daysAgo: 5,
  },
  {
    session: "New York",
    pair: "XAUUSD",
    side: "SELL",
    entry: 2305,
    exit: 2308,
    lot: 0.15,
    mood: "😡",
    daysAgo: 6,
  },
  {
    session: "Asia",
    pair: "XAUUSD",
    side: "BUY",
    entry: 2288,
    exit: 2294,
    lot: 0.4,
    mood: "😄",
    daysAgo: 8,
  },
  {
    session: "London",
    pair: "XAUUSD",
    side: "BUY",
    entry: 2275,
    exit: 2270,
    lot: 0.25,
    mood: "",
    daysAgo: 10,
  },
  {
    session: "New York",
    pair: "XAUUSD",
    side: "SELL",
    entry: 2280,
    exit: 2272,
    lot: 0.5,
    mood: "😄",
    daysAgo: 12,
  },
  {
    session: "Asia",
    pair: "XAUUSD",
    side: "BUY",
    entry: 2265,
    exit: 2271,
    lot: 0.2,
    mood: "😄",
    daysAgo: 14,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in .env.local");
    process.exit(1);
  }
  await mongoose.connect(uri);
  await Trade.deleteMany({});
  const now = Date.now();
  for (const row of samples) {
    const { daysAgo, ...rest } = row;
    const createdAt = new Date(now - daysAgo * 86400000);
    const profit = computeProfitUsd(
      rest.pair,
      rest.side,
      rest.entry,
      rest.exit,
      rest.lot,
    );
    await Trade.create({
      ...rest,
      profit,
      isWin: isWinningTrade(profit),
      createdAt,
    });
  }
  console.log(`Seeded ${samples.length} trades.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
