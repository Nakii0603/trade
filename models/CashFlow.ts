import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const cashFlowSchema = new Schema(
  {
    accountRef: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
    },
    accountId: { type: String, required: true, trim: true, maxlength: 64 },
    accountName: { type: String, required: true, trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", maxlength: 280 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

cashFlowSchema.index({ accountRef: 1 });
cashFlowSchema.index({ createdAt: -1 });

export type CashFlowDocument = InferSchemaType<typeof cashFlowSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CashFlow: Model<CashFlowDocument> =
  (mongoose.models.CashFlow as Model<CashFlowDocument>) ||
  mongoose.model<CashFlowDocument>("CashFlow", cashFlowSchema);
