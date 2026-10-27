import type { OrderStatusMeta } from '../models/order-status.model';

/** Estados de empresa y vendedor normalizados a una sola tabla de presentación. */
const STATUS_META: Readonly<Record<string, OrderStatusMeta>> = {
  pendiente: { label: 'Pendiente', tone: 'pending' },
  creada: { label: 'Creada', tone: 'pending' },
  pagada: { label: 'Pagada', tone: 'success' },
  en_preparacion: { label: 'En preparación', tone: 'info' },
  en_proceso: { label: 'En proceso', tone: 'info' },
  enviada: { label: 'Enviada', tone: 'info' },
  entregada: { label: 'Entregada', tone: 'success' },
  completado: { label: 'Completado', tone: 'success' },
  completada: { label: 'Completada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
  devuelta: { label: 'Devuelta', tone: 'danger' },
  devuelto: { label: 'Devuelto', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
  returned: { label: 'Devuelta', tone: 'danger' },
};

/** Normaliza el estado del backend para buscar sus metadatos. */
export function normalizeOrderStatusKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

/** Etiqueta y tono de un estado; un valor desconocido conserva su texto. */
export function orderStatusMeta(value: string | null | undefined): OrderStatusMeta {
  const key = normalizeOrderStatusKey(value);
  return STATUS_META[key] ?? { label: value?.trim() || 'Sin estado', tone: 'neutral' };
}

/** Etiqueta legible de un estado de pedido. */
export function orderStatusLabel(value: string | null | undefined): string {
  return orderStatusMeta(value).label;
}
