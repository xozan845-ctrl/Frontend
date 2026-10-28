import type { BankAccountType } from '../models/bank.model';

export const BANK_ACCOUNT_TYPES: readonly { value: BankAccountType; label: string }[] = [
  { value: 'ahorro', label: 'Ahorro' },
  { value: 'corriente', label: 'Corriente' },
  { value: 'wallet', label: 'Billetera digital' },
];

/** Límite de cuentas bancarias persistidas por ámbito. */
export const BANKS_MAX_RECORDS = 200;

/** Clave de localStorage aislada por ámbito y tenant/tienda (`R-NC-11`). */
export function banksStorageKey(scope: 'company' | 'store', scopeId?: string | null): string {
  const suffix =
    (scopeId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_${scope}_banks_${suffix}`;
}
