/** `ProductoResponseDto` de Core Engine (snake_case y aliases camelCase). */
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
  /** Alta/baja comercial (R-PS-03). */
  estado_operativo?: string | null;
  estadoOperativo?: string | null;
  /** Costo decimal; ausente = desconocido, no 0. */
  costo?: number | string | null;
  marca?: string | null;
  codigo_barras?: string | null;
  codigoBarras?: string | null;
  unidad?: string | null;
  permite_fracciones?: boolean | null;
  permiteFracciones?: boolean | null;
  unidad_compra?: string | null;
  unidadCompra?: string | null;
  contenido_cantidad?: number | string | null;
  contenidoCantidad?: number | string | null;
  contenido_unidad?: string | null;
  contenidoUnidad?: string | null;
  tipo_precio?: string | null;
  tipoPrecio?: string | null;
  tipo_costo?: string | null;
  tipoCosto?: string | null;
  stock_minimo?: number | string | null;
  stockMinimo?: number | string | null;
  stock_maximo?: number | string | null;
  stockMaximo?: number | string | null;
  garantia_meses?: number | string | null;
  garantiaMeses?: number | string | null;
  es_materia_prima?: boolean | null;
  esMateriaPrima?: boolean | null;
  ubicacion?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

/** `PaginaProductosResponseDto` de Core Engine. */
export interface BackendPaginaProductosDTO {
  items?: BackendCatalogProductDTO[] | null;
  total?: number | string | null;
  pagina?: number | string | null;
  limite?: number | string | null;
  paginas?: number | string | null;
}
