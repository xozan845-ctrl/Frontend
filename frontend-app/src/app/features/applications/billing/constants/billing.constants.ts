import type { InvoiceStatus, PaymentTerm } from '../models/billing.model';

/** IVA aplicado a las facturas (misma tasa que el POS del vendedor). */
export const BILLING_TAX_RATE = 0.15;

/** Estados posibles de una factura, en el orden de los filtros. */
export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  'borrador',
  'emitida',
  'pagada',
  'anulada',
];

/** Etiqueta humana de cada estado (`R-UX-4`). */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  pagada: 'Pagada',
  anulada: 'Anulada',
};

/** Condiciones de pago disponibles. */
export const PAYMENT_TERMS: readonly PaymentTerm[] = ['contado', 'credito'];

/** Etiqueta humana de cada condición de pago. */
export const PAYMENT_TERM_LABELS: Record<PaymentTerm, string> = {
  contado: 'Contado',
  credito: 'Crédito',
};

/** Días de plazo por defecto cuando la factura es a crédito. */
export const BILLING_DEFAULT_TERM_DAYS = 30;

/** Nombre de la tienda mostrado mientras no exista la integración real. */
export const BILLING_STORE_NAME = 'Mi tienda';

/** Prefijo de los identificadores estables de prueba (`R-CP-2`). */
export const BILLING_TEST_ID_PREFIX = 'billing';
