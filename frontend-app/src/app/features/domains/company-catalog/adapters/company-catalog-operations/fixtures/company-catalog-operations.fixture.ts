/** Fixtures versionados de los DTOs de operaciones del catálogo (R-C-8). */
export const INVENTORY_SETTINGS_FIXTURE = {
  empresa_id: 'empresa-demo',
  metodo_costeo: 'fifo',
  permitir_stock_negativo: true,
  alerta_stock_bajo: false,
  actualizar_costo_en_compra: true,
  unidad_defecto: 'Caja',
  actualizado_en: '2026-10-30T10:00:00.000Z',
} as const;

export const COMBO_FIXTURE = {
  id: 'combo-1',
  empresa_id: 'empresa-demo',
  sku: 'COMBO-1',
  nombre: 'Combo desayuno',
  descripcion: 'Café y pan',
  codigo_barras: '750001',
  precio: '150.00',
  costo_total: '90.00',
  margen: 40,
  estado: 'activo',
  componentes: [
    {
      producto_id: 'p-1',
      sku: 'SKU-1',
      nombre: 'Café',
      cantidad: 2,
      costo_unitario: '45.00',
      subtotal: '90.00',
    },
  ],
  creado_en: '2026-10-30T10:00:00.000Z',
  actualizado_en: '2026-10-30T10:00:00.000Z',
} as const;

export const PROMOTION_FIXTURE = {
  id: 'promo-1',
  empresa_id: 'empresa-demo',
  nombre: '2x1 café',
  tipo: 'descuento_cantidad',
  producto_id: 'p-1',
  sku: 'SKU-1',
  cantidad_requerida: 2,
  cantidad_gratis: 1,
  descuento_porcentaje: null,
  fecha_desde: '2026-10-01',
  fecha_hasta: '2026-10-31',
  estado: 'activo',
  creado_en: '2026-10-30T10:00:00.000Z',
  actualizado_en: '2026-10-30T10:00:00.000Z',
} as const;

export const MOVEMENT_FIXTURE = {
  id: 'mov-1',
  empresa_id: 'empresa-demo',
  tipo: 'traslado',
  motivo: 'Reposición',
  referencia: 'MOV-1',
  ubicacion_origen: 'Bodega',
  ubicacion_destino: 'Tienda',
  lineas: [{ producto_id: 'p-1', sku: 'SKU-1', nombre: 'Café', cantidad: 3 }],
  creado_por: 'user-1',
  creado_en: '2026-10-30T10:00:00.000Z',
} as const;

export const IMPORT_RESULT_FIXTURE = {
  importados: 2,
  omitidos: 1,
  errores: ['Fila 3: SKU duplicado'],
} as const;
