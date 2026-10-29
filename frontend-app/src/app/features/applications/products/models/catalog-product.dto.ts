/** `ProductoResponseDto` de Core Engine. */
export interface BackendCatalogProductDTO {
  id?: string | number | null;
  empresa_id?: string | number | null;
  empresaId?: string | number | null;
  sku?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  precio_base?: number | string | null;
  precioBase?: number | string | null;
  stock?: number | string | null;
  estado?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  producto_padre_id?: string | number | null;
  productoPadreId?: string | number | null;
  atributos?: Record<string, unknown> | null;
  tiene_variantes?: boolean | null;
  tieneVariantes?: boolean | null;
  imagenes?: BackendProductImageDTO[] | null;
  variantes?: BackendProductVariantDTO[] | null;
  precio_desde?: number | string | null;
  precioDesde?: number | string | null;
  stock_total?: number | string | null;
  stockTotal?: number | string | null;
}

export interface BackendProductImageDTO {
  id?: string | number | null;
  objeto_id?: string | number | null;
  objetoId?: string | number | null;
  url?: string | null;
  orden?: number | string | null;
  es_principal?: boolean | null;
  esPrincipal?: boolean | null;
}

export interface BackendProductVariantDTO {
  id?: string | number | null;
  producto_padre_id?: string | number | null;
  productoPadreId?: string | number | null;
  sku?: string | null;
  nombre?: string | null;
  atributos?: Record<string, unknown> | null;
  precio_base?: number | string | null;
  precioBase?: number | string | null;
  stock?: number | string | null;
  estado?: string | null;
  imagenes?: BackendProductImageDTO[] | null;
  creado_en?: string | null;
  creadoEn?: string | null;
}

/** `PaginaProductosResponseDto` de Core Engine. */
export interface BackendPaginaProductosDTO {
  items?: BackendCatalogProductDTO[] | null;
  total?: number | string | null;
  pagina?: number | string | null;
  limite?: number | string | null;
  paginas?: number | string | null;
}
