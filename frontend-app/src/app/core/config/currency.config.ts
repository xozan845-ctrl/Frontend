/**
 * Moneda y formato del storefront.
 *
 * El backend (Core Engine) maneja montos en córdobas nicaragüenses (NIO); la UI
 * debe mostrarlos con el símbolo y separadores locales (`C$1,200.00`). Vive en
 * `core/` porque lo consumen tanto `shared/` (pipe) como `core/` (SEO).
 */
export interface CurrencyConfig {
  /** Código ISO 4217. */
  code: string;
  /** Locale BCP 47 usado para símbolo y separadores. */
  locale: string;
}

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
