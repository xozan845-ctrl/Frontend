import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../core/models/api-response.dto';
import type { Order, OrderLine } from '../../models/order.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function toQuantity(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return 1;
  return Math.max(1, Math.round(n));
}

function adaptOrderLine(raw: unknown): OrderLine | null {
  if (!isRecord(raw)) return null;
  const productId =
    raw['producto_id'] ??
    raw['productoId'] ??
    raw['oferta_id'] ??
    raw['ofertaId'] ??
    raw['sku'] ??
    raw['codigo'];
  if (!hasId(productId)) return null;

  const cents = raw['precio_unitario_cents'];
  const unitPrice =
    typeof cents === 'number'
      ? Math.round(cents) / 100
      : toAmount(raw['precio'] ?? raw['precio_unitario'] ?? raw['unit_price']);

  return {
    productId: String(productId),
    name: toText(
      raw['nombre'] ?? raw['name'] ?? raw['producto_nombre'] ?? raw['productoNombre'],
      'Producto',
    ),
    sku: toText(raw['sku'] ?? raw['codigo']),
    unitPrice,
    quantity: toQuantity(raw['cantidad'] ?? raw['quantity']),
    ...(hasId(raw['tienda_id'] ?? raw['storeId'])
      ? { storeId: String(raw['tienda_id'] ?? raw['storeId']) }
      : {}),
  };
}

function adaptOrder(raw: unknown): Order | null {
  const data = unwrapApiSingleResponse<Record<string, unknown>>(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const id = data['id'] ?? data['_id'] ?? data['orden_id'] ?? data['order_id'];
  if (!hasId(id)) return null;

  const cliente = isRecord(data['cliente']) ? data['cliente'] : null;
  const clientId =
    (hasId(cliente?.['id']) ? cliente?.['id'] : undefined) ??
    data['cliente_id'] ??
    data['clienteId'];
  const buyerId = data['comprador_id'] ?? data['compradorId'] ?? data['buyerId'];
  const clientName = toText(
    cliente?.['nombre'] ?? cliente?.['name'],
    toText(
      data['cliente_nombre'] ?? data['comprador_nombre'] ?? data['buyerName'],
      'Cliente ocasional',
    ),
  );

  const totalValue = data['total'] ?? data['amount'];
  const total =
    totalValue !== null && totalValue !== undefined
      ? toAmount(totalValue)
      : toAmount(data['total_cents']) / 100;
  const commissionValue = data['comision'] ?? data['commission'];
  const commission =
    commissionValue !== null && commissionValue !== undefined
      ? toAmount(commissionValue)
      : data['comision_cents'] !== undefined
        ? toAmount(data['comision_cents']) / 100
        : undefined;

  const items = Array.isArray(data['items']) ? data['items'] : [];
  const lines = items
    .map((item) => adaptOrderLine(item))
    .filter((line): line is OrderLine => line !== null);

  return {
    id: String(id),
    number: toText(
      data['order_number'] ?? data['orderNumber'] ?? data['numero'] ?? data['codigo'],
      `ORD-${String(id).slice(-8).toUpperCase()}`,
    ),
    ...(hasId(clientId) ? { clientId: String(clientId) } : {}),
    ...(hasId(buyerId) ? { buyerId: String(buyerId) } : {}),
    clientName,
    createdAt: toText(
      data['creado_en'] ?? data['createdAt'] ?? data['created_at'] ?? data['fecha'],
    ),
    status: toText(data['estado'] ?? data['status'], 'pendiente'),
    total,
    lines,
    notes: toText(data['observaciones'] ?? data['notas'] ?? data['notes']),
    ...(hasId(data['tienda_id'] ?? data['storeId'])
      ? { storeId: String(data['tienda_id'] ?? data['storeId']) }
      : {}),
    ...(commission !== undefined ? { commission } : {}),
  };
}

/** Normaliza un pedido de empresa o vendedor a un único modelo. */
export function adaptOrderFromBackend(raw: unknown): Order | null {
  return adaptOrder(raw);
}

/** Normaliza una lista de pedidos tolerante a array o envelopes. */
export function adaptOrdersFromBackend(response: unknown): Order[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptOrder(raw))
    .filter((order): order is Order => order !== null);
}
