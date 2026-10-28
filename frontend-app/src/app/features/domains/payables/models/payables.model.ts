export type PayableStatus = 'pendiente' | 'pagada';

export interface PayableRecord {
  id: string;
  supplier: string;
  concept: string;
  /** Fecha de vencimiento local en `yyyy-mm-dd`. */
  dueDate: string;
  amount: number;
  status: PayableStatus;
  /** Fecha de pago local en `yyyy-mm-dd`; vacía mientras esté pendiente. */
  paidAt: string;
}

export interface CreatePayablePayload {
  supplier: string;
  concept: string;
  dueDate: string;
  amount: number;
}

export interface PayableRow extends PayableRecord {
  overdue: boolean;
}

export interface PayablesSummary {
  pendingTotal: number;
  overdueTotal: number;
  paidTotal: number;
  pendingCount: number;
}

export interface PayablesMutationResult {
  ok: boolean;
  message?: string;
}
