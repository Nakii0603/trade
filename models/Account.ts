import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const accountSchema = new Schema(
  {
    /** Case-insensitive unique key (normalized). */
    accountIdKey: { type: String, required: true, unique: true, trim: true },
    /** Account id as entered (trimmed). */
    accountId: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export type AccountDocument = InferSchemaType<typeof accountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Account: Model<AccountDocument> =
  (mongoose.models.Account as Model<AccountDocument>) ||
  mongoose.model<AccountDocument>("Account", accountSchema);
