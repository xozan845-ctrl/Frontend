import {
  adaptReportEntryFromBackend,
  type ReportEntry,
  type ReportStateAliases,
} from '@domains/reports/public-api';
import type { VendorOrder } from '../../models/vendor-order.model';

/** Traducción de los estados del pedido del vendedor al vocabulario del reporte. */
const VENDOR_STATE_ALIASES: ReportStateAliases = {
  pendiente: 'pending',
  en_proceso: 'pending',
  completada: 'delivered',
  completado: 'delivered',
  cancelada: 'cancelled',
  cancelado: 'cancelled',
  devuelta: 'returned',
  devuelto: 'returned',
};

/** Convierte un pedido del vendedor en una entrada normalizada. */
export function toVendorReportEntry(order: VendorOrder): ReportEntry {
  return adaptReportEntryFromBackend(
    { date: order.createdAt, total: order.total, status: order.status },
    VENDOR_STATE_ALIASES,
  );
}
