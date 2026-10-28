import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../../core/models/api-response.dto';
import {
  BackendCatalogProductDTO,
  BackendPaginaProductosDTO,
} from '../../models/catalog-product.dto';
import {
  CatalogProduct,
  CatalogProductPage,
  CatalogProductStatus,
} from '../../models/catalog-product.model';

function toObject<T>(raw: unknown): T | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as T) : null;
}

function hasId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function toCount(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function toStatus(value: unknown): CatalogProductStatus {
  return value === 'agotado' ? 'agotado' : 'disponible';
}

/**
 * Normaliza `ProductoResponseDto` (snake/camel, precios string/número) al
 * modelo de catálogo. `null` si no hay id.
 */
export function adaptCatalogProductFromBackend(raw: unknown): CatalogProduct | null {
  const producto = unwrapApiSingleResponse<BackendCatalogProductDTO>(raw);
  if (!producto || typeof producto !== 'object') return null;
  if (!hasId(producto.id)) return null;

  return {
    id: String(producto.id),
    companyId: hasId(producto.empresa_id ?? producto.empresaId)
      ? String(producto.empresa_id ?? producto.empresaId)
      : '',
    sku: toText(producto.sku, ''),
    name: toText(producto.nombre, 'Producto'),
    description: toText(producto.descripcion, ''),
    category: toText(producto.categoria, ''),
    basePrice: toAmount(producto.precio_base ?? producto.precioBase),
    stock: toCount(producto.stock),
    status: toStatus(producto.estado),
    createdAt: toText(producto.creado_en ?? producto.creadoEn, ''),
  };
}

/**
 * Normaliza `PaginaProductosResponseDto`: tolera `{ items, total, pagina,
 * limite, paginas }`, arrays directos y envelopes heredados.
 */
export function adaptCatalogProductPageFromBackend(response: unknown): CatalogProductPage {
  const page =
    toObject<BackendPaginaProductosDTO>(
      unwrapApiSingleResponse<BackendPaginaProductosDTO>(response),
    ) ?? {};
  const rawItems = Array.isArray(page.items)
    ? page.items
    : unwrapApiListResponse<unknown>(response);
  const items = rawItems
    .map((raw) => adaptCatalogProductFromBackend(raw))
    .filter((product): product is CatalogProduct => product !== null);

  return {
    items,
    total: toCount(page.total ?? items.length),
    page: Math.max(1, toCount(page.pagina, 1)),
    limit: Math.max(1, toCount(page.limite, 20)),
    pages: Math.max(1, toCount(page.paginas, 1)),
  };
}
