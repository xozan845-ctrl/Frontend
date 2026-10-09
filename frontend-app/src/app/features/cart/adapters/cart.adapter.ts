import { CartItem } from '../models/cart.model';
import type { Product } from '../../products/public-api';
import { BackendCarritoDTO, BackendCarritoItemDTO } from '../models/cart.dto';
import { unwrapApiSingleResponse } from '../../../core/models/api-response.dto';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

/**
 * Normaliza la vista del carrito del servidor
 * (`GET/POST/PATCH/DELETE /carrito` → `{ items, total, expira_en }`, tolerante a
 * envelope `{ data }`) a `CartItem[]`. Cada ítem viene enriquecido con la oferta
 * (`oferta_id`, `producto_nombre`, `precio_venta`, `stock`, `sku`).
 */
export function adaptCartFromBackend(response: unknown): CartItem[] {
  const cart = unwrapApiSingleResponse<BackendCarritoDTO>(response);
  const rawItems = cart && typeof cart === 'object' ? cart.items : undefined;
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map(adaptCartItemFromBackend);
}

function adaptCartItemFromBackend(raw: unknown): CartItem {
  const item = (raw ?? {}) as BackendCarritoItemDTO;
  const rawPrice = item.precio_venta ?? item.precio_base ?? 0;
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;
  const sku = typeof item.sku === 'string' ? item.sku : '';

  const product: Product = {
    id: String(item.oferta_id ?? item.id ?? ''),
    name: typeof item.producto_nombre === 'string' ? item.producto_nombre : 'Producto',
    description: sku ? `SKU ${sku}` : '',
    price,
    imageUrl: FALLBACK_IMAGE,
    category: 'General',
    stock: Number(item.stock ?? 0),
  };

  return {
    product,
    quantity: Number(item.cantidad ?? 1),
  };
}
