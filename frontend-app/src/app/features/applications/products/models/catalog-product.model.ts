/** Disponibilidad de stock del producto (`ProductoResponseDto.estado`). */
export type CatalogProductStatus = 'disponible' | 'agotado';

/** Alta/baja comercial, independiente del stock (`estado_operativo`, R-PS-03). */
export type CatalogProductOperationalStatus = 'activo' | 'inactivo';

/** Tipo de precio/costo fijo o por escala. */
export type CatalogProductPriceType = 'fijo' | 'escala';

/** Metadatos operativos editables desde el catálogo (R-PS-01). */
export interface CatalogProductMetadataData {
  /** Costo decimal como string (ej. "1500.00"); se guarda en centavos. */
  cost?: string;
  brand?: string;
  barcode?: string;
  unit?: string;
  allowFractions?: boolean;
  purchaseUnit?: string;
  contentAmount?: number;
  contentUnit?: string;
  priceType?: CatalogProductPriceType;
  costType?: CatalogProductPriceType;
  minStock?: number;
  maxStock?: number | null;
  warrantyMonths?: number | null;
  isRawMaterial?: boolean;
  location?: string;
  operationalStatus?: CatalogProductOperationalStatus;
}

/** Producto maestro del catálogo (`ProductoResponseDto`). */
export interface CatalogProduct extends Required<Omit<CatalogProductMetadataData, 'cost'>> {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  /** Precio base en córdobas. */
  basePrice: number;
  stock: number;
  /** Disponibilidad de stock; no confundir con `operationalStatus`. */
  status: CatalogProductStatus;
  /**
   * Costo en córdobas. `null` cuando el API no lo informa: no se sustituye
   * silenciosamente por 0 para no distorsionar márgenes ni KPIs.
   */
  cost: number | null;
  /** ISO 8601 UTC. */
  createdAt: string;
  /** ISO 8601 UTC. */
  updatedAt: string;
}

/** Página de productos (`PaginaProductosResponseDto`). */
export interface CatalogProductPage {
  items: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Filtros públicos de `GET /catalog/productos`. */
export interface CatalogProductFilters {
  q?: string;
  status?: CatalogProductStatus;
  category?: string;
  page?: number;
  limit?: number;
}

/** Alta de producto (`CrearProductoRequestDto`). */
export interface CreateCatalogProductData extends CatalogProductMetadataData {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  /** Precio base decimal como string (ej. "1000.00"). */
  basePrice: string;
  stock: number;
}

/** Edición de producto (`ActualizarProductoRequestDto`). */
export interface UpdateCatalogProductData extends CatalogProductMetadataData {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: string;
  stock?: number;
  /** Motivo del cambio (RN-08 histórico). */
  reason?: string;
}
