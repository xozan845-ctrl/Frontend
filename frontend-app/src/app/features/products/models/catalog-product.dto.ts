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
}

/** `PaginaProductosResponseDto` de Core Engine. */
export interface BackendPaginaProductosDTO {
  items?: BackendCatalogProductDTO[] | null;
  total?: number | string | null;
  pagina?: number | string | null;
  limite?: number | string | null;
  paginas?: number | string | null;
}
