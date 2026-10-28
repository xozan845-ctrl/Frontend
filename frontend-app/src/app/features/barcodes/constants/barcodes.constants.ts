import type { BarcodeSymbology } from '../models/barcode.model';

export const BARCODE_SYMBOLOGIES: readonly { value: BarcodeSymbology; label: string }[] = [
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'CODE128', label: 'Code 128' },
];

export const BARCODES_MAX_RECORDS = 500;
export const BARCODE_MAX_COPIES = 100;

/** Clave de localStorage aislada por ámbito y tenant/tienda (`R-NC-11`). */
export function barcodesStorageKey(scope: 'company' | 'store', scopeId?: string | null): string {
  const suffix =
    (scopeId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_${scope}_barcodes_${suffix}`;
}
