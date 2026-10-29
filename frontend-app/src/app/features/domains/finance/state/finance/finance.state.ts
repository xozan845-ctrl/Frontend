import type {
  CashClosure,
  CashMovement,
  CashPaymentMethod,
  CashPeriod,
  CashTransfer,
  ExpenseRecord,
  PettyCashFund,
  PettyCashMovement,
  PurchaseRecord,
} from '../../models/finance.model';

/** Filtros de la tabla de movimientos que viven en el store. */
export interface CashFiltersState {
  period: CashPeriod;
  search: string;
  page: number;
}

export interface FinanceState {
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  cash: CashMovement[];
  /** Movimientos derivados de ventas; no se persisten. */
  externalCash: CashMovement[];
  methods: CashPaymentMethod[];
  closures: CashClosure[];
  pettyFund: PettyCashFund;
  pettyMovements: PettyCashMovement[];
  transfers: CashTransfer[];
  filters: CashFiltersState;
}
