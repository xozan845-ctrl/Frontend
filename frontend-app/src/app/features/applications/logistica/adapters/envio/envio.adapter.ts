import { unwrapApiListResponse } from '../../../../../core/models/api-response.dto';
import { BackendEnvioDTO } from '../../models/envio.dto';
import { LogisticsMode, Shipment, ShipmentProvider } from '../../models/envio.model';

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
    ? Math.round(n * 100) / 100
    : undefined;
}

function toMode(value: unknown): LogisticsMode {
  return value === 'propia' || value === 'hibrida' ? value : 'plataforma';
}

function toProvider(value: unknown): ShipmentProvider | null {
  return value === 'plataforma' || value === 'empresa' ? value : null;
}

/** Normaliza una guía de despacho; `null` si no tiene id. */
export function adaptShipmentFromBackend(raw: unknown): Shipment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const envio = raw as BackendEnvioDTO;
  if (!envio.id) return null;

  const amount = toAmount(envio.monto);
  return {
    id: String(envio.id),
    guia: toText(envio.guia, ''),
    orderId: toText(envio.order_id ?? envio.orderId, ''),
    companyId: toText(envio.empresa_id ?? envio.empresaId, ''),
    logisticsMode: toMode(envio.modalidad_logistica ?? envio.modalidadLogistica),
    providerType: toProvider(envio.proveedor_tipo ?? envio.proveedorTipo),
    providerTenantId:
      envio.proveedor_tenant_id || envio.proveedorTenantId
        ? String(envio.proveedor_tenant_id ?? envio.proveedorTenantId)
        : null,
    status: toText(envio.estado, 'en_preparacion'),
    createdAt: toText(envio.creado_en ?? envio.creadoEn, ''),
    ...(amount !== undefined ? { amount } : {}),
  };
}

/** Lista de envíos tolerante a array directo o envelopes. */
export function adaptShipmentsFromBackend(response: unknown): Shipment[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptShipmentFromBackend(raw))
    .filter((shipment): shipment is Shipment => shipment !== null);
}
