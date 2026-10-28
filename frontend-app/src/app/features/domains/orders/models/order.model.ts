/** Línea normalizada de un pedido, independiente del contrato de origen. */
export interface OrderLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  /** Tienda de la línea cuando el contrato la expone. */
  storeId?: string;
}

/**
 * Pedido normalizado para los dominios de empresa y vendedor. El estado queda
 * como texto porque ambos contratos usan vocabularios distintos; la capa de
 * presentación lo resuelve con `ORDER_STATUS_META`.
 */
export interface Order {
  id: string;
  number: string;
  clientId?: string;
  buyerId?: string;
  clientName: string;
  /** ISO 8601 UTC; cadena vacía si el backend no la envía. */
  createdAt: string;
  status: string;
  total: number;
  lines: OrderLine[];
  notes: string;
  storeId?: string;
  commission?: number;
}
