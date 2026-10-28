export interface CreditRecord {
  id: string;
  customer: string;
  concept: string;
  /** Fecha de emisión local en `yyyy-mm-dd`. */
  date: string;
  /** Fecha de vencimiento local en `yyyy-mm-dd`. */
  dueDate: string;
  amount: number;
  /** Saldo pendiente; 0 cuando está pagado. */
  balance: number;
}

export interface CreditRow extends CreditRecord {
  overdue: boolean;
  paid: boolean;
}

export interface CreateCreditPayload {
  customer: string;
  concept: string;
  dueDate: string;
  amount: number;
}

export interface CreditsSummary {
  outstandingTotal: number;
  overdueTotal: number;
  collectedTotal: number;
  activeCount: number;
}

export interface CreditsMutationResult {
  ok: boolean;
  message?: string;
}
