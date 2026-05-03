import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = (await request.json()) as Partial<CreateTradeBody>;
    await connectDB();
    const existing = await Trade.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = body.session ?? existing.session;
    const pair = body.pair ?? existing.pair;
    const side =
      body.side === "BUY" || body.side === "SELL" ? body.side : existing.side;
    const entry = typeof body.entry === "number" ? body.entry : existing.entry;
    const exitPrice =
      typeof body.exit === "number" ? body.exit : existing.exit;
    const lot = typeof body.lot === "number" ? body.lot : existing.lot;
    const mood =
      typeof body.mood === "string" ? body.mood : (existing.mood ?? "");

    const profit = computeProfitUsd(pair, side, entry, exitPrice, lot);
    const isWin = isWinningTrade(profit);

    const doc = await Trade.findByIdAndUpdate(
      id,
      {
        session: session.trim(),
        pair: pair.trim(),
        side,
        entry,
        exit: exitPrice,
        lot,
        profit,
        isWin,
        mood,
      },
      { new: true },
    )?.lean();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(toDTO(doc as Parameters<typeof toDTO>[0]));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update trade" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const res = await Trade.findByIdAndDelete(id);
    if (!res) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to delete trade" },
      { status: 500 },
    );
  }
}
