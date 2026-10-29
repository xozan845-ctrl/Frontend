/**
 * Moneda y formato del storefront.
 *
 * El backend (Core Engine) maneja montos en córdobas nicaragüenses (NIO); la UI
 * debe mostrarlos con el símbolo y separadores locales (`C$1,200.00`). Vive en
 * `core/` porque lo consumen tanto `shared/` (pipe) como `core/` (SEO).
 */
import type { CurrencyConfig } from '../models/currency-config.model';

export type { CurrencyConfig } from '../models/currency-config.model';

export const CURRENCY: CurrencyConfig = {
  code: 'NIO',
  locale: 'es-NI',
};

/** Formatea un monto con la moneda configurada; `null`/`undefined` → `''`. */
export function formatCurrency(
  value: number | null | undefined,
  config: CurrencyConfig = CURRENCY,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(value);
}

/**
 * Formatea con el código ISO visible (`NIO 1,234.56` / `USD 50.00`). Se usa en
 * la caja para distinguir la moneda sin ambigüedad entre capturas NIO y USD.
 */
export function formatMoney(
  value: number | null | undefined,
  currency: string = CURRENCY.code,
  locale: string = CURRENCY.locale,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
