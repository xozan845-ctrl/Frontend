import { OrderItem, OrderResponse, OrderTimelineEvent } from '../../models/order.model';
import {
  BackendOrderDTO,
  BackendOrderItemDTO,
  BackendTimelineEventDTO,
} from '../../models/order.dto';
import { unwrapApiListResponse } from '../../../../core/models/api-response.dto';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Texto opcional recortado; los valores vacíos no se exponen en el dominio. */
function toOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Normaliza una línea de orden (`ItemOrden` de Core Engine). */
function adaptOrderItem(raw: unknown): OrderItem {
  const item = (raw ?? {}) as BackendOrderItemDTO;
  const cents = item.precio_unitario_cents;
  const unitPrice =
    typeof cents === 'number' ? cents / 100 : toNumber(item.precio_unitario ?? item.unit_price, 0);

  return {
    ofertaId: String(item.oferta_id ?? item.ofertaId ?? ''),
    sku: typeof item.sku === 'string' ? item.sku : '',
    name: typeof item.producto_nombre === 'string' ? item.producto_nombre : 'Producto',
    quantity: toNumber(item.cantidad ?? item.quantity, 1),
    unitPrice,
    storeId: String(item.tienda_id ?? item.storeId ?? ''),
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

  const r = raw as BackendOrderDTO;
  const rawData = r.data;
  const data = (rawData && typeof rawData === 'object' ? rawData : r) as BackendOrderDTO;
  const id = (data.id ?? data._id ?? `ord-${Date.now()}`) as string | number;
  const totalCents = data.total_cents;
  const total =
    typeof totalCents === 'number'
      ? totalCents / 100
      : Number(data.total ?? data.amount ?? fallbackTotal);
  const commissionCents = data.comision_cents;
  const commission =
    typeof commissionCents === 'number'
      ? commissionCents / 100
      : data.comision !== undefined && data.comision !== null
        ? Number(data.comision)
        : undefined;

  const rawItems = data.items;
  const orderId = String(id);
  const orderNumber = String(
    data.orderNumber ?? data.order_number ?? `ORD-${orderId.slice(-8).toUpperCase()}`,
  );

  const rawBuyer = data.comprador;
  const buyer = toRecord(rawBuyer);
  const buyerString = toOptionalText(rawBuyer);
  const shipping = toRecord(data.direccion_envio ?? data.shippingAddress);
  const buyerName = toOptionalText(
    data.comprador_nombre ??
      data.compradorNombre ??
      data.buyerName ??
      buyer?.['nombre'] ??
      buyer?.['nombre_completo'] ??
      buyer?.['name'] ??
      buyerString ??
      shipping?.['nombre_receptor'] ??
      shipping?.['nombre'] ??
      shipping?.['name'],
  );
  const buyerPhone = toOptionalText(
    data.comprador_telefono ??
      data.compradorTelefono ??
      data.buyerPhone ??
      buyer?.['telefono'] ??
      buyer?.['phone'] ??
      shipping?.['telefono'] ??
      shipping?.['phone'],
  );
  const buyerEmail = toOptionalText(
    data.comprador_email ??
      data.compradorEmail ??
      data.buyerEmail ??
      buyer?.['email'] ??
      buyer?.['correo'] ??
      shipping?.['email'] ??
      shipping?.['correo'],
  );
  const buyerCompany = toOptionalText(
    data.comprador_empresa ??
      data.compradorEmpresa ??
      data.buyerCompany ??
      buyer?.['empresa'] ??
      buyer?.['company'],
  );

  return {
    id,
    orderNumber,
    status: String(data.estado ?? data.status ?? 'creada'),
    total,
    createdAt: String(
      data.creado_en ?? data.createdAt ?? data.created_at ?? new Date().toISOString(),
    ),
    ...(data.tienda_id ? { storeId: String(data.tienda_id) } : {}),
    ...(data.comprador_id || data.compradorId
      ? { buyerId: String(data.comprador_id ?? data.compradorId) }
      : {}),
    ...(buyerName ? { buyerName } : {}),
    ...(buyerPhone ? { buyerPhone } : {}),
    ...(buyerEmail ? { buyerEmail } : {}),
    ...(buyerCompany ? { buyerCompany } : {}),
    ...(data.vendedor_id || data.vendedorId
      ? { sellerId: String(data.vendedor_id ?? data.vendedorId) }
      : {}),
    ...(commission !== undefined && Number.isFinite(commission) ? { commission } : {}),
    ...(typeof data.moneda === 'string' && data.moneda
      ? { currency: data.moneda }
      : typeof data.currency === 'string' && data.currency
        ? { currency: data.currency }
        : {}),
    ...(data.direccion_envio !== undefined && data.direccion_envio !== null
      ? { shippingAddress: data.direccion_envio }
      : data.shippingAddress !== undefined && data.shippingAddress !== null
        ? { shippingAddress: data.shippingAddress }
        : {}),
    ...(Array.isArray(rawItems) ? { items: rawItems.map(adaptOrderItem) } : {}),
    ...((data.actualizado_en ?? data.updatedAt)
      ? { updatedAt: String(data.actualizado_en ?? data.updatedAt) }
      : {}),
    ...((data.pagada_en ?? data.paidAt) ? { paidAt: String(data.pagada_en ?? data.paidAt) } : {}),
    ...((data.enviada_en ?? data.shippedAt)
      ? { shippedAt: String(data.enviada_en ?? data.shippedAt) }
      : {}),
    ...((data.entregada_en ?? data.deliveredAt)
      ? { deliveredAt: String(data.entregada_en ?? data.deliveredAt) }
      : {}),
    ...((data.cancelada_en ?? data.cancelledAt)
      ? { cancelledAt: String(data.cancelada_en ?? data.cancelledAt) }
      : {}),
    ...((data.devuelta_en ?? data.returnedAt)
      ? { returnedAt: String(data.devuelta_en ?? data.returnedAt) }
      : {}),
  };
}

/** Normaliza el historial de órdenes (`GET /orders` → `OrderView[]`). */
export function adaptOrderListFromBackend(response: unknown): OrderResponse[] {
  return unwrapApiListResponse(response).map((raw) => adaptOrderResponse(raw, 0));
}

/** Normaliza el timeline de una orden (`GET /orders/:id/timeline`). */
export function adaptOrderTimelineFromBackend(response: unknown): OrderTimelineEvent[] {
  return unwrapApiListResponse(response).map((raw) => {
    const event = (raw ?? {}) as BackendTimelineEventDTO;
    return {
      id: toNumber(event.id, 0),
      type: String(event.tipo ?? event.type ?? 'evento'),
      payload: event.payload,
      version: toNumber(event.version, 0),
      createdAt: String(event.creado_en ?? event.createdAt ?? ''),
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
