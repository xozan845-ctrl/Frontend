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
  CatalogProductOperationalStatus,
  CatalogProductPage,
  CatalogProductPriceType,
  CatalogProductStatus,
} from '../../models/catalog-product.model';

function toObject<T>(raw: unknown): T | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as T) : null;
}

function hasId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Importe opcional: `null` si el backend no informa el campo. No se usa 0 como
 * sustituto porque falsearía márgenes y el valor del inventario (R-PS-01).
 */
function toOptionalAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function toCount(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function toOptionalCount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function toStatus(value: unknown): CatalogProductStatus {
  return value === 'agotado' ? 'agotado' : 'disponible';
}

function toOperationalStatus(value: unknown): CatalogProductOperationalStatus {
  return value === 'inactivo' ? 'inactivo' : 'activo';
}

function toPriceType(value: unknown): CatalogProductPriceType {
  return value === 'escala' ? 'escala' : 'fijo';
}

/**
 * Normaliza `ProductoResponseDto` (snake/camel, precios string/número) al
 * modelo de catálogo. `null` si no hay id.
 */
export function adaptCatalogProductFromBackend(raw: unknown): CatalogProduct | null {
  const producto = unwrapApiSingleResponse<BackendCatalogProductDTO>(raw);
  if (!producto || typeof producto !== 'object') return null;
  if (!hasId(producto.id)) return null;

  const createdAt = toText(producto.creado_en ?? producto.creadoEn, '');

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
    operationalStatus: toOperationalStatus(producto.estado_operativo ?? producto.estadoOperativo),
    cost: toOptionalAmount(producto.costo),
    brand: toText(producto.marca, ''),
    barcode: toText(producto.codigo_barras ?? producto.codigoBarras, ''),
    unit: toText(producto.unidad, 'Unidad (u)'),
    allowFractions: toBoolean(producto.permite_fracciones ?? producto.permiteFracciones),
    purchaseUnit: toText(producto.unidad_compra ?? producto.unidadCompra, 'Igual que la de venta'),
    contentAmount: toCount(producto.contenido_cantidad ?? producto.contenidoCantidad),
    contentUnit: toText(producto.contenido_unidad ?? producto.contenidoUnidad, 'Sin contenido'),
    priceType: toPriceType(producto.tipo_precio ?? producto.tipoPrecio),
    costType: toPriceType(producto.tipo_costo ?? producto.tipoCosto),
    minStock: toCount(producto.stock_minimo ?? producto.stockMinimo),
    maxStock: toOptionalCount(producto.stock_maximo ?? producto.stockMaximo),
    warrantyMonths: toOptionalCount(producto.garantia_meses ?? producto.garantiaMeses),
    isRawMaterial: toBoolean(producto.es_materia_prima ?? producto.esMateriaPrima),
    location: toText(producto.ubicacion, ''),
    createdAt,
    updatedAt: toText(producto.actualizado_en ?? producto.actualizadoEn, createdAt),
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
