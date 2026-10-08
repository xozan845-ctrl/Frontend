import { OrderItem, OrderResponse, OrderTimelineEvent } from '../models/order.model';
import { unwrapApiListResponse } from '../../../core/models/api-response.dto';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Normaliza una línea de orden (`ItemOrden` de Core Engine). */
function adaptOrderItem(raw: unknown): OrderItem {
  const item = (raw ?? {}) as Record<string, unknown>;
  const cents = item['precio_unitario_cents'];
  const unitPrice =
    typeof cents === 'number'
      ? cents / 100
      : toNumber(item['precio_unitario'] ?? item['unit_price'], 0);

  return {
    ofertaId: String(item['oferta_id'] ?? item['ofertaId'] ?? ''),
    sku: typeof item['sku'] === 'string' ? item['sku'] : '',
    name: typeof item['producto_nombre'] === 'string' ? item['producto_nombre'] : 'Producto',
    quantity: toNumber(item['cantidad'] ?? item['quantity'], 1),
    unitPrice,
    storeId: String(item['tienda_id'] ?? item['storeId'] ?? ''),
  };
}

/**
 * Normaliza una orden del backend (`OrderView`) al modelo de dominio.
 * Tolerante a `{ data: {...} }`, snake_case/camelCase y centavos.
 */
export function adaptOrderResponse(raw: unknown, fallbackTotal: number): OrderResponse {
  if (!raw || typeof raw !== 'object') {
    return generateMockOrderResponse(fallbackTotal);
  }

  const r = raw as Record<string, unknown>;
  const rawData = r['data'];
  const data = rawData && typeof rawData === 'object' ? (rawData as Record<string, unknown>) : r;
  const id = (data['id'] ?? data['_id'] ?? `ord-${Date.now()}`) as string | number;
  const totalCents = data['total_cents'];
  const total =
    typeof totalCents === 'number'
      ? totalCents / 100
      : Number(data['total'] ?? data['amount'] ?? fallbackTotal);

  const rawItems = data['items'];

  return {
    id,
    orderNumber: String(
      data['orderNumber'] ?? data['order_number'] ?? `ORD-${String(id).slice(-6)}`,
    ),
    status: String(data['estado'] ?? data['status'] ?? 'creada'),
    total,
    createdAt: String(
      data['creado_en'] ?? data['createdAt'] ?? data['created_at'] ?? new Date().toISOString(),
    ),
    storeId: data['tienda_id'] ? String(data['tienda_id']) : undefined,
    items: Array.isArray(rawItems) ? rawItems.map(adaptOrderItem) : undefined,
  };
}

/** Normaliza el historial de órdenes (`GET /orders` → `OrderView[]`). */
export function adaptOrderListFromBackend(response: unknown): OrderResponse[] {
  return unwrapApiListResponse(response).map((raw) => adaptOrderResponse(raw, 0));
}

/** Normaliza el timeline de una orden (`GET /orders/:id/timeline`). */
export function adaptOrderTimelineFromBackend(response: unknown): OrderTimelineEvent[] {
  return unwrapApiListResponse(response).map((raw) => {
    const event = (raw ?? {}) as Record<string, unknown>;
    return {
      id: toNumber(event['id'], 0),
      type: String(event['tipo'] ?? event['type'] ?? 'evento'),
      payload: event['payload'],
      version: toNumber(event['version'], 0),
      createdAt: String(event['creado_en'] ?? event['createdAt'] ?? ''),
    };
  });
}

/** Genera una respuesta de orden simulada consistente. */
export function generateMockOrderResponse(total: number): OrderResponse {
  return {
    id: `ord-${Date.now()}`,
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    status: 'confirmed',
    total,
    createdAt: new Date().toISOString(),
  };
}
