import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { computeProfitUsd, isWinningTrade } from "@/lib/profit";
import { Account } from "@/models/Account";
import { Trade } from "@/models/Trade";
import type { CreateTradeBody, TradeDTO } from "@/types/trade";

export const dynamic = "force-dynamic";

type TradeLean = {
  _id: { toString: () => string };
  accountRef?: { toString: () => string } | null;
  accountId?: string;
  accountName?: string;
  /** @deprecated legacy field */
  account?: string;
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
};

function toDTO(doc: TradeLean): TradeDTO {
  const legacyName = doc.account?.trim();
  const ref =
    doc.accountRef != null ? doc.accountRef.toString() : undefined;
  return {
    _id: doc._id.toString(),
    ...(ref ? { accountRef: ref } : {}),
    accountId: doc.accountId?.trim() || "—",
    accountName: doc.accountName?.trim() || legacyName || "—",
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
    return NextResponse.json(trades.map((t) => toDTO(t as TradeLean)));
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
    const {
      accountMongoId,
      accountId,
      accountName,
      session,
      pair,
      side,
      entry,
      exit: exitPrice,
      lot,
      mood,
    } = body;

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

    const mongoId =
      typeof accountMongoId === "string" ? accountMongoId.trim() : "";

    await connectDB();

    let resolvedAccountId: string;
    let resolvedAccountName: string;
    let accountRef: mongoose.Types.ObjectId | undefined;

    if (mongoId && mongoose.Types.ObjectId.isValid(mongoId)) {
      const acc = await Account.findById(mongoId).lean();
      if (!acc) {
        return NextResponse.json({ error: "Unknown account" }, { status: 400 });
      }
      const row = acc as {
        _id: mongoose.Types.ObjectId;
        accountId: string;
        accountName: string;
      };
      accountRef = new mongoose.Types.ObjectId(row._id.toString());
      resolvedAccountId = row.accountId.trim().toLowerCase();
      resolvedAccountName = row.accountName.trim();
    } else if (accountId?.trim() && accountName?.trim()) {
      resolvedAccountId = accountId.trim().toLowerCase();
      resolvedAccountName = accountName.trim();
      const acc = await Account.findOne({
        accountIdKey: resolvedAccountId,
      }).lean();
      if (acc) {
        accountRef = new mongoose.Types.ObjectId(
          (acc as { _id: mongoose.Types.ObjectId })._id.toString(),
        );
      }
    } else {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    const profit = computeProfitUsd(pair, side, entry, exitPrice, lot);
    const isWin = isWinningTrade(profit);

    const doc = await Trade.create({
      ...(accountRef ? { accountRef } : {}),
      accountId: resolvedAccountId,
      accountName: resolvedAccountName,
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
        accountRef: doc.accountRef ?? undefined,
        accountId: doc.accountId,
        accountName: doc.accountName,
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
