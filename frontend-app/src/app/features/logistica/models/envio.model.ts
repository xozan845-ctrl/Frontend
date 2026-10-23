/** Modalidad logística de la empresa. */
export type LogisticsMode = 'plataforma' | 'propia' | 'hibrida';

/** Flota que atiende un envío híbrido. */
export type ShipmentProvider = 'plataforma' | 'empresa';

/** Estados de la guía de despacho. */
export type ShipmentStatus = 'en_preparacion' | 'enviada' | 'entregada' | 'cancelada';

/** Guía de despacho (`EnvioResponseDto` / `EnvioConMontoResponseDto`). */
export interface Shipment {
  id: string;
  guia: string;
  orderId: string;
  companyId: string;
  logisticsMode: LogisticsMode;
  providerType: ShipmentProvider | null;
  providerTenantId: string | null;
  status: string;
  createdAt: string;
  /** Monto del envío (solo `GET /admin/envios`). */
  amount?: number;
}

/** Etiquetas legibles de estado de envío. */
const SHIPMENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  en_preparacion: 'En preparación',
  enviada: 'Enviada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

export function shipmentStatusLabel(status: string | undefined | null): string {
  if (!status) return '';
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}
