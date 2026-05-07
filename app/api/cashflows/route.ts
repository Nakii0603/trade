import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { CashFlow } from "@/models/CashFlow";
import type { CashFlowDTO, CreateCashFlowBody } from "@/types/cashflow";

export const dynamic = "force-dynamic";

type CashFlowLean = {
  _id: { toString: () => string };
  accountRef?: { toString: () => string } | null;
  accountId?: string;
  accountName?: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  note?: string;
  createdAt: Date;
};

function toDTO(doc: CashFlowLean): CashFlowDTO {
  const ref = doc.accountRef ? doc.accountRef.toString() : undefined;
  return {
    _id: doc._id.toString(),
    ...(ref ? { accountRef: ref } : {}),
    accountId: doc.accountId?.trim() || "—",
    accountName: doc.accountName?.trim() || "—",
    type: doc.type,
    amount: doc.amount,
    note: doc.note,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const q: Record<string, unknown> = {};
    if (type === "DEPOSIT" || type === "WITHDRAWAL") q.type = type;
    const rows = await CashFlow.find(q).sort({ createdAt: -1 }).lean();
    return NextResponse.json(rows.map((r) => toDTO(r as CashFlowLean)));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load cashflows" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateCashFlowBody>;
    const {
      accountMongoId,
      accountId,
      accountName,
      type,
      amount,
      note,
      createdAt,
    } = body;

    if (
      (type !== "DEPOSIT" && type !== "WITHDRAWAL") ||
      typeof amount !== "number" ||
      amount <= 0
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

    const parsedCreatedAt =
      typeof createdAt === "string" && createdAt.trim()
        ? new Date(createdAt)
        : null;
    const hasValidCreatedAt =
      parsedCreatedAt !== null &&
      Number.isFinite(parsedCreatedAt.getTime());

    const doc = await CashFlow.create({
      ...(accountRef ? { accountRef } : {}),
      accountId: resolvedAccountId,
      accountName: resolvedAccountName,
      type,
      amount,
      note: typeof note === "string" ? note.trim() : "",
      ...(hasValidCreatedAt ? { createdAt: parsedCreatedAt } : {}),
    });

    return NextResponse.json(
      toDTO({
        _id: doc._id,
        accountRef: doc.accountRef ?? undefined,
        accountId: doc.accountId,
        accountName: doc.accountName,
        type: doc.type,
        amount: doc.amount,
        note: doc.note,
        createdAt: doc.createdAt ?? new Date(),
      }),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create cashflow" },
      { status: 500 },
    );
  }
}
