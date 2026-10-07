import { OrderResponse } from '../models/order.model';

/**
 * Normaliza cualquier respuesta de orden del backend al modelo de dominio OrderResponse.
 * Tolerante a formatos anidados ({ data: { ... } }), snake_case, camelCase y tipos alternativos.
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
  };
}

/**
 * Genera una respuesta de orden simulada consistente.
 */
export function generateMockOrderResponse(total: number): OrderResponse {
  return {
    id: `ord-${Date.now()}`,
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    status: 'confirmed',
    total,
    createdAt: new Date().toISOString(),
  };
}
