import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../../core/models/api-response.dto';
import {
  BackendCatalogProductDTO,
  BackendProductImageDTO,
  BackendProductVariantDTO,
  BackendPaginaProductosDTO,
} from '../../models/catalog-product.dto';
import {
  CatalogProduct,
  CatalogProductImage,
  CatalogProductPage,
  CatalogProductStatus,
  CatalogProductVariant,
} from '../../models/catalog-product.model';
import { resolveProductResourceUrl } from '../resource-url/resource-url.adapter';

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

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}

function toId(value: unknown): string {
  return hasId(value) ? String(value) : '';
}

function toOptionalAmount(value: unknown): number | null {
  return value === null || value === undefined || value === '' ? null : toAmount(value);
}

export function adaptCatalogProductImageFromBackend(
  raw: BackendProductImageDTO | null | undefined,
  apiUrl?: string,
): CatalogProductImage | null {
  if (!raw || !hasId(raw.id) || !hasId(raw.objeto_id ?? raw.objetoId)) return null;

  return {
    id: toId(raw.id),
    objectId: toId(raw.objeto_id ?? raw.objetoId),
    url: resolveProductResourceUrl(raw.url, apiUrl),
    order: Math.max(0, toCount(raw.orden)),
    isPrimary: Boolean(raw.es_principal ?? raw.esPrincipal),
  };
}

export function adaptCatalogProductVariantFromBackend(
  raw: BackendProductVariantDTO | null | undefined,
  apiUrl?: string,
): CatalogProductVariant | null {
  if (!raw || !hasId(raw.id)) return null;
  const images = (raw.imagenes ?? [])
    .map((image) => adaptCatalogProductImageFromBackend(image, apiUrl))
    .filter((image): image is CatalogProductImage => image !== null);

  return {
    id: toId(raw.id),
    parentProductId: toId(raw.producto_padre_id ?? raw.productoPadreId),
    sku: toText(raw.sku, ''),
    name: toText(raw.nombre, 'Variante'),
    attributes: toRecord(raw.atributos),
    basePrice: toAmount(raw.precio_base ?? raw.precioBase),
    stock: toCount(raw.stock),
    status: toStatus(raw.estado),
    images,
    createdAt: toText(raw.creado_en ?? raw.creadoEn, ''),
  };
}

/**
 * Normaliza `ProductoResponseDto` (snake/camel, precios string/número) al
 * modelo de catálogo. `null` si no hay id.
 */
export function adaptCatalogProductFromBackend(
  raw: unknown,
  apiUrl?: string,
): CatalogProduct | null {
  const producto = unwrapApiSingleResponse<BackendCatalogProductDTO>(raw);
  if (!producto || typeof producto !== 'object') return null;
  if (!hasId(producto.id)) return null;

  const images = (producto.imagenes ?? [])
    .map((image) => adaptCatalogProductImageFromBackend(image, apiUrl))
    .filter((image): image is CatalogProductImage => image !== null);
  const variants = (producto.variantes ?? [])
    .map((variant) => adaptCatalogProductVariantFromBackend(variant, apiUrl))
    .filter((variant): variant is CatalogProductVariant => variant !== null);

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
    parentProductId: hasId(producto.producto_padre_id ?? producto.productoPadreId)
      ? String(producto.producto_padre_id ?? producto.productoPadreId)
      : null,
    attributes: toRecord(producto.atributos),
    hasVariants: Boolean(producto.tiene_variantes ?? producto.tieneVariantes ?? variants.length),
    images,
    variants,
    priceFrom: toOptionalAmount(producto.precio_desde ?? producto.precioDesde),
    totalStock: toOptionalAmount(producto.stock_total ?? producto.stockTotal),
  };
}

/**
 * Normaliza `PaginaProductosResponseDto`: tolera `{ items, total, pagina,
 * limite, paginas }`, arrays directos y envelopes heredados.
 */
export function adaptCatalogProductPageFromBackend(
  response: unknown,
  apiUrl?: string,
): CatalogProductPage {
  const page =
    toObject<BackendPaginaProductosDTO>(
      unwrapApiSingleResponse<BackendPaginaProductosDTO>(response),
    ) ?? {};
  const rawItems = Array.isArray(page.items)
    ? page.items
    : unwrapApiListResponse<unknown>(response);
  const items = rawItems
    .map((raw) => adaptCatalogProductFromBackend(raw, apiUrl))
    .filter((product): product is CatalogProduct => product !== null);

  return {
    items,
    total: toCount(page.total ?? items.length),
    page: Math.max(1, toCount(page.pagina, 1)),
    limit: Math.max(1, toCount(page.limite, 20)),
    pages: Math.max(1, toCount(page.paginas, 1)),
  };
}
