import type { BackendCatalogProductDTO } from '../../products/public-api';
import type { BackendCompanyServiceDTO } from './company-service.dto';

/** `ConfiguracionInventarioResponseDto`. */
export interface BackendInventorySettingsDTO {
  empresa_id?: string | null;
  empresaId?: string | null;
  metodo_costeo?: string | null;
  metodoCosteo?: string | null;
  permitir_stock_negativo?: boolean | null;
  permitirStockNegativo?: boolean | null;
  alerta_stock_bajo?: boolean | null;
  alertaStockBajo?: boolean | null;
  actualizar_costo_en_compra?: boolean | null;
  actualizarCostoEnCompra?: boolean | null;
  unidad_defecto?: string | null;
  unidadDefecto?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

/** `ComboComponenteResponseDto`. */
export interface BackendComboComponentDTO {
  producto_id?: string | null;
  productoId?: string | null;
  sku?: string | null;
  nombre?: string | null;
  cantidad?: number | string | null;
  costo_unitario?: number | string | null;
  costoUnitario?: number | string | null;
  subtotal?: number | string | null;
}

/** `ComboResponseDto`. */
export interface BackendComboDTO {
  id?: string | null;
  empresa_id?: string | null;
  empresaId?: string | null;
  sku?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  codigo_barras?: string | null;
  codigoBarras?: string | null;
  precio?: number | string | null;
  costo_total?: number | string | null;
  costoTotal?: number | string | null;
  margen?: number | string | null;
  estado?: string | null;
  componentes?: BackendComboComponentDTO[] | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

/** `PromocionResponseDto`. */
export interface BackendPromotionDTO {
  id?: string | null;
  empresa_id?: string | null;
  empresaId?: string | null;
  nombre?: string | null;
  tipo?: string | null;
  producto_id?: string | null;
  productoId?: string | null;
  sku?: string | null;
  cantidad_requerida?: number | string | null;
  cantidadRequerida?: number | string | null;
  cantidad_gratis?: number | string | null;
  cantidadGratis?: number | string | null;
  descuento_porcentaje?: number | string | null;
  descuentoPorcentaje?: number | string | null;
  fecha_desde?: string | null;
  fechaDesde?: string | null;
  fecha_hasta?: string | null;
  fechaHasta?: string | null;
  estado?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

/** Línea de `MovimientoInventarioResponseDto`. */
export interface BackendMovementLineDTO {
  producto_id?: string | null;
  productoId?: string | null;
  sku?: string | null;
  nombre?: string | null;
  cantidad?: number | string | null;
}

/** `MovimientoInventarioResponseDto`. */
export interface BackendInventoryMovementDTO {
  id?: string | null;
  empresa_id?: string | null;
  empresaId?: string | null;
  tipo?: string | null;
  motivo?: string | null;
  referencia?: string | null;
  ubicacion_origen?: string | null;
  ubicacionOrigen?: string | null;
  ubicacion_destino?: string | null;
  ubicacionDestino?: string | null;
  lineas?: BackendMovementLineDTO[] | null;
  creado_por?: string | null;
  creadoPor?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
}

/** Envoltura paginada de combos/promociones/movimientos. */
export interface BackendOperationsPageDTO<T> {
  items?: T[] | null;
  data?: T[] | null;
  results?: T[] | null;
  total?: number | string | null;
  pagina?: number | string | null;
  limite?: number | string | null;
  paginas?: number | string | null;
}

/** `ImportarProductosResponseDto`. */
export interface BackendImportResultDTO {
  importados?: number | string | null;
  omitidos?: number | string | null;
  errores?: string[] | null;
}

/** `EscaneoResponseDto`. */
export interface BackendScanResultDTO {
  tipo?: string | null;
  producto?: BackendCatalogProductDTO | null;
  servicio?: BackendCompanyServiceDTO | null;
}
