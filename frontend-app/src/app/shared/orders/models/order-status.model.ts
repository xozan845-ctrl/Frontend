/** Tono visual de un estado de pedido. */
export type OrderStatusTone = 'pending' | 'info' | 'success' | 'danger' | 'neutral';

/** Etiqueta y tono de un estado de pedido. */
export interface OrderStatusMeta {
  label: string;
  tone: OrderStatusTone;
}
