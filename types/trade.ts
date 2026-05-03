export type Side = "BUY" | "SELL";

export interface TradeDTO {
  _id: string;
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
