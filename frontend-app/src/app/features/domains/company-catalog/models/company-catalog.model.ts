/** Pestañas del catálogo de empresa. */
export type CompanyCatalogTab = 'productos' | 'servicios' | 'materia-prima';

/** Modo del modal de alta/edición. */
export type CompanyCatalogModalMode = 'create' | 'edit';

/** Tipo de registro administrable en el catálogo. */
export type CompanyCatalogKind = 'producto' | 'servicio';

/** Estado visible de un producto o servicio. */
export type CompanyCatalogStatus = 'activo' | 'inactivo';

/** Filtros rápidos de la tabla. */
export type CompanyCatalogStatusFilter = 'todos' | 'activos' | 'inactivos' | 'stock-bajo';

/** Ordenaciones disponibles en la tabla. */
export type CompanyCatalogSort =
  | 'nombre-az'
  | 'nombre-za'
  | 'precio-asc'
  | 'precio-desc'
  | 'stock-asc'
  | 'stock-desc'
  | 'reciente';

/** Tipo de precio/costo (fijo o escalonado). */
export type CompanyCatalogFieldType = 'fijo' | 'escala';

/**
 * Fila unificada de la tabla del catálogo. Combina el producto del API con sus
 * metadatos locales y normaliza también los servicios.
 */
export interface CompanyCatalogRow {
  id: string;
  kind: CompanyCatalogKind;
  code: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  barcode: string;
  price: number;
  /** `null` cuando el costo no está informado por el API (R-PS-01). */
  cost: number | null;
  /** `null` cuando no hay costo o el precio no permite calcularlo. */
  margin: number | null;
  stock: number | null;
  minStock: number;
  maxStock: number | null;
  durationMinutes: number | null;
  status: CompanyCatalogStatus;
  unit: string;
  allowFractions: boolean;
  purchaseUnit: string;
  contentAmount: number;
  contentUnit: string;
  priceType: CompanyCatalogFieldType;
  costType: CompanyCatalogFieldType;
  warrantyMonths: number | null;
  isRawMaterial: boolean;
  location: string;
  createdAt: string;
  updatedAt: string;
}

/** Valores que emite el modal de alta/edición. */
export interface CompanyCatalogFormValue {
  type: CompanyCatalogKind;
  name: string;
  description: string;
  category: string;
  code: string;
  brand: string;
  barcode: string;
  cost: string;
  price: string;
  unit: string;
  allowFractions: boolean;
  purchaseUnit: string;
  contentAmount: number;
  contentUnit: string;
  priceType: CompanyCatalogFieldType;
  costType: CompanyCatalogFieldType;
  stock: number;
  minStock: number;
  maxStock: number | null;
  warrantyMonths: number | null;
  isRawMaterial: boolean;
  location: string;
  status: CompanyCatalogStatus;
  createdAt: string;
  durationMinutes: number;
}

/** KPIs de productos del catálogo. */
export interface CompanyProductKpis {
  activeProducts: number;
  /**
   * Valor del inventario (stock × costo). `null` si algún producto no tiene
   * costo conocido: mostrar un total parcial sería engañoso (R-PS-01).
   */
  inventoryValue: number | null;
  /** Productos sin costo informado por el backend. */
  missingCostCount: number;
  inventoryOk: number;
  rawMaterial: number;
}

/** Filtros compartidos por las tablas del catálogo. */
export interface CompanyCatalogFilters {
  query: string;
  status: CompanyCatalogStatusFilter;
  brand: string;
  sort: CompanyCatalogSort;
  onlyRawMaterial: boolean;
}

/** Resultado de una mutación local del catálogo. */
export interface CompanyCatalogMutationResult {
  ok: boolean;
  message?: string;
}
