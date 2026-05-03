import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { computeProfitUsd, isWinningTrade } from "@/lib/profit";
import { Trade } from "@/models/Trade";
import type { CreateTradeBody, TradeDTO } from "@/types/trade";

export const dynamic = "force-dynamic";

function toDTO(doc: {
  _id: { toString: () => string };
  session: string;
  pair: string;
  side: "BUY" | "SELL";
  entry: number;
  exit: number;
  lot: number;
  profit: number;
  isWin: boolean;
  mood?: string;
  createdAt: Date;
}): TradeDTO {
  return {
    _id: doc._id.toString(),
    session: doc.session,
    pair: doc.pair,
    side: doc.side,
    entry: doc.entry,
    exit: doc.exit,
    lot: doc.lot,
    profit: doc.profit,
    isWin: doc.isWin,
    mood: doc.mood,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const q: Record<string, unknown> = {};
    if (from || to) {
      q.createdAt = {};
      if (from) (q.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) (q.createdAt as Record<string, Date>).$lte = new Date(to);
    }
    const trades = await Trade.find(q).sort({ createdAt: -1 }).lean();
    return NextResponse.json(trades.map((t) => toDTO(t as Parameters<typeof toDTO>[0])));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load trades" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateTradeBody>;
    const { session, pair, side, entry, exit: exitPrice, lot, mood } = body;

    if (
      !session ||
      !pair ||
      (side !== "BUY" && side !== "SELL") ||
      typeof entry !== "number" ||
      typeof exitPrice !== "number" ||
      typeof lot !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    await connectDB();
    const profit = computeProfitUsd(pair, side, entry, exitPrice, lot);
    const isWin = isWinningTrade(profit);

    const doc = await Trade.create({
      session: session.trim(),
      pair: pair.trim(),
      side,
      entry,
      exit: exitPrice,
      lot,
      profit,
      isWin,
      mood: typeof mood === "string" ? mood : "",
    });

    return NextResponse.json(
      toDTO({
        _id: doc._id,
        session: doc.session,
        pair: doc.pair,
        side: doc.side,
        entry: doc.entry,
        exit: doc.exit,
        lot: doc.lot,
        profit: doc.profit,
        isWin: doc.isWin,
        mood: doc.mood,
        createdAt: doc.createdAt ?? new Date(),
      }),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 },
    );
  }
}
