import { BARCODE_MAX_COPIES, BARCODES_MAX_RECORDS } from '../../constants/barcodes.constants';
import type {
  BarcodeLabel,
  BarcodeSymbology,
  BarcodesSummary,
  CreateBarcodeLabelPayload,
} from '../../models/barcode.model';

const SYMBOLOGY_VALUES: readonly BarcodeSymbology[] = ['EAN13', 'CODE128'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toCopies(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed)) return 0;
  return parsed >= 1 && parsed <= BARCODE_MAX_COPIES ? parsed : 0;
}

/** Dígito verificador EAN-13 a partir de los 12 primeros dígitos. */
export function ean13CheckDigit(base: string): number {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(base[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

export function isValidBarcodeCode(code: string, symbology: BarcodeSymbology): boolean {
  if (symbology === 'EAN13') return isValidEan13(code);
  return /^[A-Za-z0-9._-]{3,40}$/.test(code);
}

/** Genera un EAN-13 válido a partir de una semilla numérica. */
export function generateEan13(seed: string = `${Date.now()}${Math.random()}`): string {
  const digits = seed.replace(/\D/g, '').padEnd(12, '0').slice(-12);
  return `${digits}${ean13CheckDigit(digits)}`;
}

export function generateCode128(seed: string = `${Date.now()}`): string {
  const value = seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `BC-${value.slice(-12).padStart(6, '0')}`;
}

function normalizeCode(code: string, symbology: BarcodeSymbology): string {
  if (symbology === 'EAN13') return code.replace(/\s/g, '');
  return code.trim().toUpperCase();
}

export function createBarcodeLabel(
  payload: CreateBarcodeLabelPayload,
  now: Date = new Date(),
): BarcodeLabel | null {
  const productName = toText(payload.productName);
  const sku = toText(payload.sku);
  const copies = toCopies(payload.copies);
  if (!productName || !sku || copies === 0 || !SYMBOLOGY_VALUES.includes(payload.symbology)) {
    return null;
  }
  const rawCode = toText(payload.code);
  const code = rawCode
    ? normalizeCode(rawCode, payload.symbology)
    : payload.symbology === 'EAN13'
      ? generateEan13(sku)
      : generateCode128(sku || productName);
  if (!isValidBarcodeCode(code, payload.symbology)) return null;
  return {
    id: createBarcodeId(),
    productName,
    sku,
    code,
    symbology: payload.symbology,
    copies,
    createdAt: now.toISOString(),
  };
}

export function createBarcodeId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `barcode-${random}`;
  return `barcode-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function adaptLabel(raw: Record<string, unknown>): BarcodeLabel | null {
  const id = toText(raw['id']);
  const productName = toText(raw['productName']);
  const sku = toText(raw['sku']);
  const code = toText(raw['code']);
  const symbology = raw['symbology'];
  const copies = toCopies(raw['copies']);
  const createdAt = toText(raw['createdAt']);
  if (
    !id ||
    !productName ||
    !sku ||
    !code ||
    !createdAt ||
    copies === 0 ||
    !SYMBOLOGY_VALUES.includes(symbology as BarcodeSymbology) ||
    !isValidBarcodeCode(code, symbology as BarcodeSymbology)
  ) {
    return null;
  }
  return {
    id,
    productName,
    sku,
    code,
    symbology: symbology as BarcodeSymbology,
    copies,
    createdAt,
  };
}

/** Normaliza etiquetas persistidas y descarta códigos inválidos. */
export function sanitizeBarcodeLabels(value: unknown): BarcodeLabel[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adaptLabel(item) : null))
    .filter((item): item is BarcodeLabel => item !== null)
    .slice(0, BARCODES_MAX_RECORDS);
}

export function computeBarcodesSummary(labels: readonly BarcodeLabel[]): BarcodesSummary {
  return {
    labelsCount: labels.length,
    totalCopies: labels.reduce((sum, label) => sum + label.copies, 0),
  };
}
