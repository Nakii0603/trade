import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const tradeSchema = new Schema(
  {
    /** Links this trade to `Account` — preferred for filtering. */
    accountRef: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
    },
    accountId: { type: String, required: true, trim: true, maxlength: 64 },
    accountName: { type: String, required: true, trim: true, maxlength: 120 },
    session: { type: String, required: true, trim: true },
    pair: { type: String, required: true, trim: true },
    side: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    entry: { type: Number, required: true },
    exit: { type: Number, required: true },
    lot: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    isWin: { type: Boolean, required: true },
    mood: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

tradeSchema.index({ accountRef: 1 });

export type TradeDocument = InferSchemaType<typeof tradeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Trade: Model<TradeDocument> =
  (mongoose.models.Trade as Model<TradeDocument>) ||
  mongoose.model<TradeDocument>("Trade", tradeSchema);
