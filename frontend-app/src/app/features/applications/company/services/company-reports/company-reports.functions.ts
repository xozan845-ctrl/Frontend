import type { OrderResponse } from '@domains/orders/public-api';
import {
  adaptReportEntryFromBackend,
  type ReportEntry,
  type ReportStateAliases,
} from '@domains/reports/public-api';

/** Traducción de los estados del contrato de empresa al vocabulario del reporte. */
const COMPANY_STATE_ALIASES: ReportStateAliases = {
  creada: 'pending',
  creado: 'pending',
  pendiente: 'pending',
  en_preparacion: 'pending',
  preparando: 'pending',
  enviada: 'pending',
  enviado: 'pending',
  en_camino: 'pending',
  processing: 'pending',
  shipped: 'pending',
  paid: 'paid',
  pagada: 'paid',
  pagado: 'paid',
  delivered: 'delivered',
  entregada: 'delivered',
  entregado: 'delivered',
  completada: 'delivered',
  completado: 'delivered',
  completed: 'delivered',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  cancelada: 'cancelled',
  cancelado: 'cancelled',
  anulada: 'cancelled',
  anulado: 'cancelled',
  voided: 'cancelled',
  returned: 'returned',
  devuelta: 'returned',
  devuelto: 'returned',
  refunded: 'returned',
  reembolsada: 'returned',
  reembolsado: 'returned',
};

/** Convierte una orden del contrato de empresa en una entrada normalizada. */
export function toCompanyReportEntry(order: OrderResponse): ReportEntry {
  return adaptReportEntryFromBackend(
    { date: order.createdAt, total: order.total, status: order.status },
    COMPANY_STATE_ALIASES,
  );
}
