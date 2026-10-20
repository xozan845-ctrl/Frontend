/** Estados del ciclo de vida de una factura (vocabulario del dominio). */
export type InvoiceStatus = 'borrador' | 'emitida' | 'pagada' | 'anulada';

/** Condición de pago acordada con el cliente. */
export type PaymentTerm = 'contado' | 'credito';

/** Cliente al que se factura (modelo estable, sin `snake_case`). */
export interface BillingClient {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
}

/** Producto facturable del catálogo del vendedor. */
export interface BillingProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  inStock: boolean;
}

/** Línea de una factura con el precio congelado al momento de emitirla. */
export interface InvoiceLine {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

/** Cabecera editable de la factura que se está armando. */
export interface InvoiceInfo {
  storeName: string;
  date: string;
  paymentTerm: PaymentTerm;
}

/** Factura ya registrada (listado y detalle). */
export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  issuedAt: string;
  dueAt: string | null;
  paymentTerm: PaymentTerm;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes: string;
}

/** Totales derivados de las líneas y el descuento. */
export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

/** Redondeo de dinero a dos decimales (`R-U-6`). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula subtotal, descuento, IVA y total de una factura (`R-CX-3`): función
 * pura y sin efectos, reutilizada por el POS visual y el detalle.
 */
export function calculateInvoiceTotals(
  lines: readonly InvoiceLine[],
  discountPercent: number,
  taxRate: number,
): InvoiceTotals {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const safePercent = Math.min(100, Math.max(0, discountPercent));
  const discountAmount = roundMoney((subtotal * safePercent) / 100);
  const taxAmount = roundMoney((subtotal - discountAmount) * taxRate);
  const total = roundMoney(subtotal - discountAmount + taxAmount);

  return { subtotal, discountAmount, taxAmount, total };
}

/** Importe de una línea con el mismo redondeo que los totales. */
export function invoiceLineTotal(line: InvoiceLine): number {
  return roundMoney(line.unitPrice * line.quantity);
}
