export type BankAccountType = 'ahorro' | 'corriente' | 'wallet';

export interface BankAccount {
  id: string;
  bank: string;
  alias: string;
  accountNumber: string;
  type: BankAccountType;
  /** Saldo actual en moneda local; nunca negativo. */
  balance: number;
}

export interface CreateBankAccountPayload {
  bank: string;
  alias: string;
  accountNumber: string;
  type: BankAccountType;
  balance: number;
}

export interface BanksSummary {
  totalBalance: number;
  accountsCount: number;
}

export interface BanksMutationResult {
  ok: boolean;
  message?: string;
}
