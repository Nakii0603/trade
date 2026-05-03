export interface AccountDTO {
  _id: string;
  accountId: string;
  accountName: string;
  createdAt: string;
}

export interface AccountListItem {
  accountId: string;
  accountName: string;
}
