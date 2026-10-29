/** Estado del producto en el catálogo (`ProductoResponseDto.estado`). */
export type CatalogProductStatus = 'disponible' | 'agotado';

export interface CatalogProductImage {
  id: string;
  objectId: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

export interface CatalogProductVariant {
  id: string;
  parentProductId: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  basePrice: number;
  stock: number;
  status: CatalogProductStatus;
  images: CatalogProductImage[];
  createdAt: string;
}

/** Producto maestro del catálogo (`ProductoResponseDto`). */
export interface CatalogProduct {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  /** Precio base en córdobas. */
  basePrice: number;
  stock: number;
  status: CatalogProductStatus;
  /** ISO 8601 UTC. */
  createdAt: string;
  parentProductId?: string | null;
  attributes?: Record<string, unknown>;
  hasVariants?: boolean;
  images?: CatalogProductImage[];
  variants?: CatalogProductVariant[];
  priceFrom?: number | null;
  totalStock?: number | null;
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
  companyId?: string;
  q?: string;
  status?: CatalogProductStatus;
  category?: string;
  page?: number;
  limit?: number;
}

/** Alta de producto (`CrearProductoRequestDto`). */
export interface CreateCatalogProductData {
  sku: string;
  companyId?: string;
  name: string;
  description?: string;
  category?: string;
  /** Precio base decimal como string (ej. "1000.00"). */
  basePrice: string;
  stock: number;
  attributes?: Record<string, unknown>;
  images?: ProductImageData[];
  variants?: CreateCatalogProductVariantData[];
}

export interface ProductImageData {
  objectId: string;
  order?: number;
  isPrimary?: boolean;
}

export interface CreateCatalogProductVariantData {
  sku: string;
  name?: string;
  attributes?: Record<string, unknown>;
  basePrice: string;
  stock: number;
  images?: ProductImageData[];
}

/** Edición de producto (`ActualizarProductoRequestDto`). */
export interface UpdateCatalogProductData {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: string;
  stock?: number;
  /** Motivo del cambio (RN-08 histórico). */
  reason?: string;
  attributes?: Record<string, unknown>;
}

export type UpdateCatalogProductVariantData = Omit<UpdateCatalogProductData, 'reason'>;
