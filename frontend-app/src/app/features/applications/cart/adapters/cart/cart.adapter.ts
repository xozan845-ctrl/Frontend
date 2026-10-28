import { CartItem, CartSnapshot } from '../../models/cart.model';
import type { Product } from '../../../products/public-api';
import { BackendCarritoDTO, BackendCarritoItemDTO } from '../../models/cart.dto';
import { unwrapApiSingleResponse } from '../../../../../core/models/api-response.dto';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

function toAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Normaliza la vista del carrito del servidor
 * (`GET/POST/PATCH/DELETE /carrito` → `{ items, total, expira_en }`, tolerante a
 * envelope `{ data }`) a `CartSnapshot`. Cada ítem viene enriquecido con la
 * oferta (`oferta_id`, `tienda_id`, `vendedor_id`, `producto_nombre`,
 * `precio_venta`, `stock`, `sku`, `estado`).
 */
export function adaptCartFromBackend(response: unknown): CartSnapshot {
  const cart = unwrapApiSingleResponse<BackendCarritoDTO>(response);
  const rawItems = cart && typeof cart === 'object' ? cart.items : undefined;
  const items = Array.isArray(rawItems) ? rawItems.map(adaptCartItemFromBackend) : [];
  const derivedTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return {
    items,
    total:
      toAmount(cart && typeof cart === 'object' ? cart.total : undefined) || round2(derivedTotal),
    expiresAt: cart && typeof cart === 'object' ? (cart.expira_en ?? cart.expiresAt ?? null) : null,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function adaptCartItemFromBackend(raw: unknown): CartItem {
  const item = (raw ?? {}) as BackendCarritoItemDTO;
  const price = toAmount(item.precio_venta ?? item.precio_base);
  const sku = typeof item.sku === 'string' ? item.sku : '';
  const offerId = String(item.oferta_id ?? item.id ?? '');

  const product: Product = {
    id: offerId,
    name: typeof item.producto_nombre === 'string' ? item.producto_nombre : 'Producto',
    description: sku ? `SKU ${sku}` : '',
    price,
    imageUrl: FALLBACK_IMAGE,
    category: 'General',
    stock: Number(item.stock ?? 0),
  };

  return {
    product,
    quantity: Math.max(1, Number(item.cantidad ?? 1)),
    offerId,
    storeId:
      item.tienda_id !== null && item.tienda_id !== undefined
        ? String(item.tienda_id)
        : item.tiendaId !== null && item.tiendaId !== undefined
          ? String(item.tiendaId)
          : undefined,
    sellerId:
      item.vendedor_id !== null && item.vendedor_id !== undefined
        ? String(item.vendedor_id)
        : item.vendedorId !== null && item.vendedorId !== undefined
          ? String(item.vendedorId)
          : undefined,
    sku,
    status: typeof item.estado === 'string' ? item.estado : undefined,
  };
}
