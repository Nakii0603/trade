import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

    const ex = existing.toObject() as {
      accountRef?: mongoose.Types.ObjectId;
      accountId?: string;
      accountName?: string;
      account?: string;
    };
    const fallbackName =
      ex.accountName?.trim() || ex.account?.trim() || "Unknown";
    const fallbackId = ex.accountId?.trim() || "—";

    const accountMongoBody =
      typeof body.accountMongoId === "string"
        ? body.accountMongoId.trim()
        : "";

    let accountId =
      typeof body.accountId === "string" && body.accountId.trim()
        ? body.accountId.trim().toLowerCase()
        : fallbackId.trim().toLowerCase();
    let accountName =
      typeof body.accountName === "string" && body.accountName.trim()
        ? body.accountName.trim()
        : fallbackName;

    let nextAccountRef: mongoose.Types.ObjectId | undefined = ex.accountRef;

    if (accountMongoBody && mongoose.Types.ObjectId.isValid(accountMongoBody)) {
      const acc = await Account.findById(accountMongoBody).lean();
      if (!acc) {
        return NextResponse.json({ error: "Unknown account" }, { status: 400 });
      }
      const row = acc as {
        _id: mongoose.Types.ObjectId;
        accountId: string;
        accountName: string;
      };
      nextAccountRef = new mongoose.Types.ObjectId(row._id.toString());
      accountId = row.accountId.trim().toLowerCase();
      accountName = row.accountName.trim();
    } else {
      const acc = await Account.findOne({ accountIdKey: accountId }).lean();
      if (acc?._id) {
        nextAccountRef = new mongoose.Types.ObjectId(
          (acc._id as mongoose.Types.ObjectId).toString(),
        );
      }
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
        accountId,
        accountName,
        ...(nextAccountRef ? { accountRef: nextAccountRef } : {}),
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
    return NextResponse.json(toDTO(doc as TradeLean));
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
