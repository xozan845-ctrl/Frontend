/** Estado del producto en el catálogo (`ProductoResponseDto.estado`). */
export type CatalogProductStatus = 'disponible' | 'agotado';

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
export interface CreateCatalogProductData {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  /** Precio base decimal como string (ej. "1000.00"). */
  basePrice: string;
  stock: number;
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
}
