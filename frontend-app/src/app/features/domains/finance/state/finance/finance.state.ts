import type { CashMovement, ExpenseRecord, PurchaseRecord } from '../../models/finance.model';

export interface FinanceState {
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  cash: CashMovement[];
}
