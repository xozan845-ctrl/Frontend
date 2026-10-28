import { unwrapApiListResponse } from '../../../../../core/models/api-response.dto';
import { BackendCompanySaleDTO, BackendCompanySalesDTO } from '../../models/company-sales.dto';
import { CompanySale, CompanySalesAccount } from '../../models/company-sales.model';

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Normaliza una venta de empresa; `null` sin `order_id`. */
export function adaptCompanySaleFromBackend(raw: unknown): CompanySale | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const sale = raw as BackendCompanySaleDTO;
  const orderId = sale.order_id ?? sale.orderId;
  if (!orderId) return null;

  return {
    orderId: String(orderId),
    sale: toNumber(sale.venta),
    commission: toNumber(sale.comision),
    companyAmount: toNumber(sale.monto_empresario ?? sale.montoEmpresario),
    status: toText(sale.estado) || 'acreditada',
    date: toText(sale.fecha),
  };
}

/** Normaliza el estado de cuenta de la empresa. */
export function adaptCompanySalesAccountFromBackend(response: unknown): CompanySalesAccount {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return { companyId: '', sales: [], pendingCommissions: 0 };
  }

  const account = response as BackendCompanySalesDTO;
  const sales = (
    Array.isArray(account.ventas) ? account.ventas : unwrapApiListResponse<unknown>(response)
  )
    .map((raw) => adaptCompanySaleFromBackend(raw))
    .filter((sale): sale is CompanySale => sale !== null);

  return {
    companyId: toText(account.empresa_id ?? account.empresaId),
    sales,
    pendingCommissions: toNumber(account.comisiones_pendientes ?? account.comisionesPendientes),
  };
}
