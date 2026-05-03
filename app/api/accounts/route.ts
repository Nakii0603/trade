import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import type { AccountListItem } from "@/types/account";

export const dynamic = "force-dynamic";

function toListItem(doc: {
  _id: { toString: () => string };
  accountId: string;
  accountName: string;
}): AccountListItem {
  return {
    _id: doc._id.toString(),
    accountId: doc.accountId,
    accountName: doc.accountName,
  };
}

export async function GET() {
  try {
    await connectDB();
    const rows = await Account.find()
      .sort({ accountName: 1, accountId: 1 })
      .lean();
    return NextResponse.json(
      rows.map((r) =>
        toListItem(
          r as {
            _id: { toString: () => string };
            accountId: string;
            accountName: string;
          },
        ),
      ),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      accountId: string;
      accountName: string;
    }>;
    const id = body.accountId?.trim();
    const name = body.accountName?.trim();
    if (!id || !name) {
      return NextResponse.json(
        { error: "accountId and accountName are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const accountIdKey = id.toLowerCase();
    const doc = await Account.findOneAndUpdate(
      { accountIdKey },
      {
        $set: {
          accountId: id,
          accountName: name,
          accountIdKey,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return NextResponse.json(toListItem(doc.toObject()));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to save account" },
      { status: 500 },
    );
  }
}
