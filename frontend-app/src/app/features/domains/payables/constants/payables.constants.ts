import type { PayableStatus } from '../models/payables.model';

export const PAYABLE_STATUSES: readonly { value: PayableStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagada', label: 'Pagada' },
];

/** Límite de cuentas por pagar persistidas por ámbito. */
export const PAYABLES_MAX_RECORDS = 500;

/** Clave de localStorage aislada por ámbito y tenant/tienda (`R-NC-11`). */
export function payablesStorageKey(scope: 'company' | 'store', scopeId?: string | null): string {
  const suffix =
    (scopeId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_${scope}_payables_${suffix}`;
}
