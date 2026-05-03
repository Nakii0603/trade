export type Side = "BUY" | "SELL";

export interface TradeDTO {
  _id: string;
  /** Set when trade is linked to an Account document in MongoDB. */
  accountRef?: string;
  accountId: string;
  accountName: string;
  session: string;
  pair: string;
  side: Side;
  entry: number;
  exit: number;
  lot: number;
  profit: number;
  isWin: boolean;
  mood?: string;
  createdAt: string;
}

export interface CreateTradeBody {
  /** Preferred — resolves `accountId` / `accountName` from Account. */
  accountMongoId?: string;
  accountId: string;
  accountName: string;
  session: string;
  pair: string;
  side: Side;
  entry: number;
  exit: number;
  lot: number;
  mood?: string;
}
