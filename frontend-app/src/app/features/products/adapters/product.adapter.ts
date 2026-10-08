import { Product } from '../models/product.model';
import { Store } from '../models/store.model';
import { BackendProductDTO } from '../models/product.dto';
import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../core/models/api-response.dto';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

/**
 * Convierte cualquier formato de producto de un backend al modelo de dominio Product.
 * Es totalmente tolerante a camelCase, snake_case, nombres alternativos y tipos de datos (strings numéricos).
 */
export function adaptProductFromBackend(raw: unknown): Product {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `prod-${Date.now()}`,
      name: 'Producto sin nombre',
      description: '',
      price: 0,
      imageUrl: DEFAULT_FALLBACK_IMAGE,
      category: 'General',
      stock: 0,
    };
  }

  const dto = raw as BackendProductDTO;

  // Normalizar ID
  const rawId =
    dto.id ??
    dto._id ??
    dto.productId ??
    dto.product_id ??
    `p-${Math.random().toString(36).slice(2, 8)}`;
  const id: string | number = typeof rawId === 'number' ? rawId : String(rawId);

  // Normalizar Nombre / Título
  const name =
    dto.nombre || dto.name || dto.title || dto.product_name || dto.label || 'Producto sin nombre';

  // Normalizar Descripción
  const description = dto.descripcion || dto.description || dto.details || dto.desc || '';

  // Normalizar Precio
  const rawPrice = dto.precio_base ?? dto.price ?? dto.unit_price ?? dto.cost ?? dto.amount ?? 0;
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;

  // Normalizar Precio Original (si existe)
  const rawOrigPrice = dto.originalPrice ?? dto.original_price ?? dto.compare_at_price;
  const originalPrice =
    rawOrigPrice != null
      ? typeof rawOrigPrice === 'number'
        ? rawOrigPrice
        : parseFloat(String(rawOrigPrice))
      : undefined;

  // Normalizar Imagen Principal
  const imageUrl =
    dto.imageUrl ||
    dto.image_url ||
    dto.image ||
    dto.thumbnail ||
    dto.photo ||
    DEFAULT_FALLBACK_IMAGE;

  // Normalizar Galería de Imágenes
  const images = dto.images || dto.gallery || dto.photos || [imageUrl];

  // Normalizar Categoría
  let category = 'General';
  if (typeof dto.categoria === 'string' && dto.categoria.trim().length > 0) {
    category = dto.categoria.trim();
  } else if (typeof dto.category === 'string' && dto.category.trim().length > 0) {
    category = dto.category.trim();
  } else if (dto.category && typeof dto.category === 'object') {
    category = dto.category.name || dto.category.title || 'General';
  } else if (dto.category_name || dto.categoryName || dto.department) {
    category = (dto.category_name || dto.categoryName || dto.department)!.trim();
  }

  // Normalizar Stock
  let stock: number;
  if (dto.stock != null) stock = Number(dto.stock);
  else if (dto.inventory != null) stock = Number(dto.inventory);
  else if (dto.quantity != null) stock = Number(dto.quantity);
  else if (dto.stock_quantity != null) stock = Number(dto.stock_quantity);
  else if (dto.in_stock != null) stock = dto.in_stock ? 10 : 0;
  else stock = 10; // Stock default si el backend no maneja inventario

  // Normalizar Variantes
  const variants = dto.variants;

  return {
    id,
    name,
    description,
    price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    imageUrl,
    images: images.length > 0 ? images : [imageUrl],
    category,
    stock,
    variants,
  };
}

/**
 * Convierte cualquier respuesta de lista de productos (plana o paginada) a Product[]
 */
export function adaptProductListFromBackend(response: unknown): Product[] {
  const items = unwrapApiListResponse(response);
  return items.map(adaptProductFromBackend);
}

/**
 * Convierte cualquier respuesta de producto individual a Product
 */
export function adaptSingleProductFromBackend(response: unknown): Product {
  const item = unwrapApiSingleResponse(response);
  return adaptProductFromBackend(item);
}

/**
 * Ofertas del storefront (Core Engine `GET /tiendas/:id` → `{ tienda, ofertas }`).
 * El `id` de la oferta es el `oferta_id` que exige el checkout. Las ofertas solo
 * traen `producto_nombre`/`precio_venta`/`stock`/`sku`, así que la descripción y
 * la categoría se enriquecen desde el catálogo (`catalog`).
 */
export function adaptOfertaListFromBackend(
  response: unknown,
  catalog?: Map<string, CatalogEntry>,
): Product[] {
  if (!response || typeof response !== 'object') return [];
  const ofertas = (response as Record<string, unknown>)['ofertas'];
  if (!Array.isArray(ofertas)) return [];
  return ofertas.map((oferta) => adaptOfertaFromBackend(oferta, catalog));
}

export function adaptOfertaFromBackend(raw: unknown, catalog?: Map<string, CatalogEntry>): Product {
  const oferta = (raw ?? {}) as Record<string, unknown>;
  const rawPrice = oferta['precio_venta'] ?? oferta['precio_base'] ?? 0;
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;
  const sku = typeof oferta['sku'] === 'string' ? oferta['sku'] : '';

  const entry =
    catalog?.get(String(oferta['producto_id'] ?? '')) ?? (sku ? catalog?.get(sku) : undefined);

  return {
    id: (oferta['id'] ?? `of-${Date.now()}`) as string | number,
    name: typeof oferta['producto_nombre'] === 'string' ? oferta['producto_nombre'] : 'Producto',
    description: entry?.description || (sku ? `SKU ${sku}` : ''),
    price,
    imageUrl: DEFAULT_FALLBACK_IMAGE,
    category: entry?.category || 'General',
    stock: Number(oferta['stock'] ?? 0),
  };
}

/** Campos del producto de catálogo que se fusionan sobre la oferta. */
export interface CatalogEntry {
  description: string;
  category: string;
}

/**
 * Índice de productos de catálogo (`GET /catalog/productos`) por `id` y por
 * `sku`, para enriquecer las ofertas del storefront.
 */
export function buildCatalogLookup(response: unknown): Map<string, CatalogEntry> {
  const lookup = new Map<string, CatalogEntry>();
  for (const raw of unwrapApiListResponse(response)) {
    if (!raw || typeof raw !== 'object') continue;
    const producto = raw as Record<string, unknown>;
    const entry: CatalogEntry = {
      description: typeof producto['descripcion'] === 'string' ? producto['descripcion'] : '',
      category:
        typeof producto['categoria'] === 'string' && producto['categoria']
          ? producto['categoria']
          : '',
    };
    for (const key of [producto['id'], producto['_id'], producto['sku']]) {
      if (key !== undefined && key !== null && key !== '') {
        lookup.set(String(key), entry);
      }
    }
  }
  return lookup;
}

/**
 * Tienda de Core Engine (`GET /tiendas/:id` → `tienda`). Tolerante a
 * `snake_case`/`camelCase`; devuelve `null` si no hay id.
 */
export function adaptStoreFromBackend(raw: unknown): Store | null {
  if (!raw || typeof raw !== 'object') return null;
  const tienda = raw as Record<string, unknown>;
  const id = tienda['id'];
  if (id === null || id === undefined || id === '') return null;

  return {
    id: String(id),
    vendorId: String(tienda['vendedor_id'] ?? tienda['vendorId'] ?? ''),
    name: typeof tienda['nombre'] === 'string' ? tienda['nombre'] : 'Tienda',
    description: typeof tienda['descripcion'] === 'string' ? tienda['descripcion'] : '',
  };
}

/**
 * Storefront completo de una tienda (`GET /tiendas/:id` → `{ tienda, ofertas }`).
 * Las ofertas se mapean a `Product` (su `id` es el `oferta_id` del checkout).
 */
export function adaptStorefrontFromBackend(
  response: unknown,
  catalogResponse?: unknown,
): {
  store: Store | null;
  products: Product[];
} {
  const catalog = catalogResponse ? buildCatalogLookup(catalogResponse) : undefined;
  const tienda =
    response && typeof response === 'object'
      ? (response as Record<string, unknown>)['tienda']
      : undefined;

  return {
    store: adaptStoreFromBackend(tienda),
    products: adaptOfertaListFromBackend(response, catalog),
  };
}
