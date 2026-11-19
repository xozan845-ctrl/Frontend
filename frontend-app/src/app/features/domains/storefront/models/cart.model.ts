import type { Product } from './product.model';

/** Línea del carrito enriquecida por el backend. */
export interface CartItem {
  product: Product;
  quantity: number;
  /** Id de la oferta (`oferta_id`); coincide con `product.id`. */
  offerId?: string;
  /** Tienda de la oferta. */
  storeId?: string;
  /** Vendedor de la oferta. */
  sellerId?: string;
  sku?: string;
  /** Estado de la oferta (`activa`, `agotada`, …). */
  status?: string;
}

/**
 * Vista completa del carrito del servidor (`CarritoResponseDto`):
 * líneas, total autoritativo y expiración de la reserva.
 */
export interface CartSnapshot {
  items: CartItem[];
  /**
   * Total autoritativo del servidor. `null` cuando la respuesta no trae un
   * total válido; `0` es un total válido (p. ej. una promoción completa).
   */
  total: number | null;
  /** ISO 8601 UTC; `null` si el carrito está vacío. */
  expiresAt: string | null;
}
