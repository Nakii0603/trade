export type CashFlowType = "DEPOSIT" | "WITHDRAWAL";

export interface CashFlowDTO {
  _id: string;
  accountRef?: string;
  accountId: string;
  accountName: string;
  type: CashFlowType;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface CreateCashFlowBody {
  accountMongoId?: string;
  accountId: string;
  accountName: string;
  type: CashFlowType;
  amount: number;
  note?: string;
  createdAt?: string;
}
