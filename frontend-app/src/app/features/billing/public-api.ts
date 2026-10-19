/**
 * API pública del feature `billing` para dominios consumidores (`R-CX-6`).
 * Las rutas del módulo se cargan de forma perezosa desde `billing.routes.ts`.
 */
export {
  BILLING_DEFAULT_TERM_DAYS,
  BILLING_STORE_NAME,
  BILLING_TAX_RATE,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  PAYMENT_TERMS,
  PAYMENT_TERM_LABELS,
} from './constants/billing.constants';
export { calculateInvoiceTotals, invoiceLineTotal } from './models/billing.model';
export type {
  BillingClient,
  BillingProduct,
  Invoice,
  InvoiceInfo,
  InvoiceLine,
  InvoiceStatus,
  InvoiceTotals,
  PaymentTerm,
} from './models/billing.model';
