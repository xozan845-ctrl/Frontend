import {
  adaptCombosFromBackend,
  adaptComboFromBackend,
  adaptImportResultFromBackend,
  adaptInventorySettingsFromBackend,
  adaptMovementsFromBackend,
  adaptMovementFromBackend,
  adaptPromotionsFromBackend,
  adaptPromotionFromBackend,
  adaptScanResultFromBackend,
  comboToCreatePayload,
  comboToUpdatePayload,
  importRowToPayload,
  inventorySettingsToPayload,
  movementToPayload,
  promotionToPayload,
} from './company-catalog-operations.adapter';
import { parseProductsCsv } from '../../models/company-product-import.parser';
import {
  movementTypeLabel,
  promotionDetailLabel,
  promotionTypeLabel,
} from '../../models/company-catalog-operations.labels';
import type {
  CompanyComboFormValue,
  CompanyInventoryMovementFormValue,
  CompanyPromotion,
  CompanyPromotionFormValue,
} from '../../models/company-catalog-operations.model';
import { CATALOG_PRODUCT_FIXTURE } from '../../../products/adapters/fixtures/catalog-product.fixture';
import { SERVICE_FIXTURE } from './fixtures/company-service.fixture';

const promoSample: CompanyPromotion = {
  id: 'promo-1',
  companyId: 'e-1',
  name: 'Promo',
  type: '2x1',
  productId: null,
  sku: '',
  requiredQuantity: null,
  freeQuantity: null,
  discountPercentage: null,
  from: '2026-10-01',
  to: '2026-10-31',
  status: 'activo',
  createdAt: '',
  updatedAt: '',
};

const comboForm: CompanyComboFormValue = {
  sku: 'COMBO-1',
  name: 'Combo desayuno',
  description: 'Café y pan',
  barcode: '7500001',
  price: '150.00',
  status: 'activo',
  components: [
    { productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 2 },
    { productId: '', sku: '', name: '', quantity: 1 },
  ],
};

const promotionForm: CompanyPromotionFormValue = {
  name: '2x1 café',
  type: 'descuento_cantidad',
  productId: 'p-1',
  sku: 'SKU-1',
  requiredQuantity: 2,
  freeQuantity: 1,
  discountPercentage: null,
  from: '2026-10-01',
  to: '2026-10-31',
  status: 'activo',
};

const movementForm: CompanyInventoryMovementFormValue = {
  type: 'traslado',
  reason: 'Reposición',
  reference: 'MOV-1',
  origin: 'Bodega',
  destination: 'Tienda',
  lines: [
    { productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 3 },
    { productId: '', sku: '', name: '', quantity: 1 },
  ],
};

describe('company-catalog-operations adapter', () => {
  it('normaliza la configuración de inventario y sus defaults', () => {
    expect(
      adaptInventorySettingsFromBackend({
        empresa_id: 'e-1',
        metodo_costeo: 'fifo',
        permitir_stock_negativo: true,
        alerta_stock_bajo: false,
        actualizar_costo_en_compra: true,
        unidad_defecto: 'Caja',
        actualizado_en: '2026-10-27T00:00:00.000Z',
      }),
    ).toEqual({
      companyId: 'e-1',
      costMethod: 'fifo',
      allowNegativeStock: true,
      lowStockAlert: false,
      updateCostOnPurchase: true,
      defaultUnit: 'Caja',
      updatedAt: '2026-10-27T00:00:00.000Z',
    });

    expect(adaptInventorySettingsFromBackend({ metodoCosteo: 'otro' })).toMatchObject({
      costMethod: 'promedio',
      allowNegativeStock: false,
      lowStockAlert: false,
      defaultUnit: 'Unidad (u)',
    });
    expect(adaptInventorySettingsFromBackend(null)).toBeNull();
  });

  it('normaliza combos, componentes y listados', () => {
    const raw = {
      id: 'combo-1',
      empresa_id: 'e-1',
      sku: 'COMBO-1',
      nombre: 'Desayuno',
      descripcion: 'Café y pan',
      codigo_barras: '750',
      precio: '150.00',
      costo_total: '90.00',
      margen: 40,
      estado: 'activo',
      componentes: [
        {
          producto_id: 'p-1',
          sku: 'SKU-1',
          nombre: 'Café',
          cantidad: '2',
          costo_unitario: '45.00',
          subtotal: '90.00',
        },
      ],
      creado_en: '2026-10-27T00:00:00.000Z',
      actualizado_en: '2026-10-28T00:00:00.000Z',
    };

    expect(adaptComboFromBackend(raw)).toMatchObject({
      id: 'combo-1',
      sku: 'COMBO-1',
      name: 'Desayuno',
      price: 150,
      totalCost: 90,
      margin: 40,
      components: [{ productId: 'p-1', sku: 'SKU-1', quantity: 2, subtotal: 90 }],
    });
    expect(adaptCombosFromBackend({ items: [raw, raw, { id: null }] })).toHaveLength(1);
    expect(adaptCombosFromBackend(null)).toEqual([]);
  });

  it('normaliza promociones y movimientos', () => {
    expect(
      adaptPromotionFromBackend({
        id: 'promo-1',
        empresa_id: 'e-1',
        nombre: '2x1',
        tipo: 'descuento_cantidad',
        producto_id: 'p-1',
        sku: 'SKU-1',
        cantidad_requerida: '2',
        cantidad_gratis: 1,
        fecha_desde: '2026-10-01T00:00:00.000Z',
        fecha_hasta: '2026-10-31',
        estado: 'activo',
      }),
    ).toMatchObject({
      id: 'promo-1',
      type: 'descuento_cantidad',
      requiredQuantity: 2,
      freeQuantity: 1,
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(adaptPromotionsFromBackend({ items: [null] })).toEqual([]);

    expect(
      adaptMovementFromBackend({
        id: 'mov-1',
        empresa_id: 'e-1',
        tipo: 'traslado',
        motivo: 'Reposición',
        referencia: 'MOV-1',
        ubicacion_origen: 'Bodega',
        ubicacion_destino: 'Tienda',
        lineas: [{ producto_id: 'p-1', sku: 'SKU-1', nombre: 'Café', cantidad: 3 }],
        creado_en: '2026-10-27T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: 'mov-1',
      type: 'traslado',
      origin: 'Bodega',
      destination: 'Tienda',
      lines: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 3 }],
    });
    expect(adaptMovementsFromBackend({ items: [{ id: 'mov-1' }] })).toHaveLength(1);
  });

  it('normaliza resultados de importación y escaneo', () => {
    expect(
      adaptImportResultFromBackend({ importados: '2', omitidos: 1, errores: ['fila 3'] }),
    ).toEqual({ imported: 2, skipped: 1, errors: ['fila 3'] });
    expect(adaptImportResultFromBackend(null)).toEqual({ imported: 0, skipped: 0, errors: [] });

    expect(
      adaptScanResultFromBackend({ tipo: 'producto', producto: CATALOG_PRODUCT_FIXTURE }),
    ).toMatchObject({
      kind: 'producto',
      product: { id: CATALOG_PRODUCT_FIXTURE.id },
    });
    expect(
      adaptScanResultFromBackend({ tipo: 'servicio', servicio: SERVICE_FIXTURE }),
    ).toMatchObject({
      kind: 'servicio',
      service: { id: SERVICE_FIXTURE.id },
    });
    expect(adaptScanResultFromBackend({ tipo: 'producto' })).toBeNull();
  });

  it('construye payloads de configuración, combo, promoción y movimiento', () => {
    expect(
      inventorySettingsToPayload({
        costMethod: 'ueps',
        allowNegativeStock: true,
        lowStockAlert: false,
        updateCostOnPurchase: true,
        defaultUnit: 'Caja',
      }),
    ).toEqual({
      metodo_costeo: 'ueps',
      permitir_stock_negativo: true,
      alerta_stock_bajo: false,
      actualizar_costo_en_compra: true,
      unidad_defecto: 'Caja',
    });

    expect(comboToCreatePayload(comboForm)).toEqual({
      sku: 'COMBO-1',
      nombre: 'Combo desayuno',
      descripcion: 'Café y pan',
      codigo_barras: '7500001',
      precio: '150.00',
      estado: 'activo',
      componentes: [{ producto_id: 'p-1', sku: 'SKU-1', cantidad: 2 }],
    });
    expect(comboToUpdatePayload(comboForm)).not.toHaveProperty('sku');

    expect(promotionToPayload(promotionForm)).toMatchObject({
      nombre: '2x1 café',
      tipo: 'descuento_cantidad',
      producto_id: 'p-1',
      sku: 'SKU-1',
      cantidad_requerida: 2,
      cantidad_gratis: 1,
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-31',
      estado: 'activo',
    });
    expect(
      promotionToPayload({
        ...promotionForm,
        type: 'descuento_porcentaje',
        discountPercentage: 15,
      }),
    ).toMatchObject({ descuento_porcentaje: 15 });

    expect(movementToPayload(movementForm)).toMatchObject({
      tipo: 'traslado',
      motivo: 'Reposición',
      ubicacion_origen: 'Bodega',
      ubicacion_destino: 'Tienda',
      lineas: [{ producto_id: 'p-1', sku: 'SKU-1', cantidad: 3 }],
    });
    expect(
      importRowToPayload({
        sku: 'SKU-1',
        name: 'Café',
        description: '',
        category: '',
        basePrice: '100.00',
        stock: 2,
        cost: '',
        brand: '',
        barcode: '',
        unit: 'Unidad (u)',
        minStock: 0,
        maxStock: null,
        isRawMaterial: false,
        location: '',
      }),
    ).toMatchObject({ sku: 'SKU-1', precio_base: '100.00', stock: 2, costo: undefined });
  });

  it('parsea CSV válido con comillas y booleanos', () => {
    const csv = [
      'nombre,descripcion,categoria,sku,precio_venta,costo,stock_inicial,stock_minimo,codigo_barras,marca,es_materia_prima',
      '"Café, molido",Demo,Bebidas,SKU-1,100.50,60,5,2,750,Acme,si',
    ].join('\n');
    const result = parseProductsCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      name: 'Café, molido',
      sku: 'SKU-1',
      basePrice: '100.50',
      cost: '60',
      stock: 5,
      minStock: 2,
      barcode: '750',
      brand: 'Acme',
      isRawMaterial: true,
    });
  });

  it('rechaza CSV sin encabezados o filas inválidas', () => {
    expect(parseProductsCsv('solo una linea').errors[0]).toContain('filas');
    expect(parseProductsCsv('foo,bar\n1,2').errors[0]).toContain('nombre y sku');

    const csv = [
      'nombre,sku,precio_venta,stock_inicial',
      'Café,SKU-1,100,2',
      ',SKU-2,100,2',
      'Té,SKU-3,gratis,2',
      'Azúcar,SKU-4,100,-1',
    ].join('\n');
    const result = parseProductsCsv(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(3);
  });
});

describe('company-catalog-operations adapter · ramas defensivas', () => {
  it('normaliza combos con aliases, defaults y estado inactivo', () => {
    expect(
      adaptComboFromBackend({
        id: 'combo-2',
        empresaId: 'e-1',
        sku: 'C-2',
        nombre: 'Combo',
        codigoBarras: '999',
        precio: '20.5',
        costoTotal: '10',
        margen: '49.5',
        estado: 'inactivo',
        componentes: [null, { sku: '' }, { sku: 'SKU-1', cantidad: 0, costoUnitario: '10' }],
      }),
    ).toMatchObject({
      id: 'combo-2',
      companyId: 'e-1',
      barcode: '999',
      price: 20.5,
      totalCost: 10,
      margin: 49.5,
      status: 'inactivo',
      components: [{ sku: 'SKU-1', quantity: 1, name: 'SKU-1' }],
    });

    expect(adaptComboFromBackend({ id: null })).toBeNull();
    expect(adaptComboFromBackend(null)).toBeNull();
    expect(adaptCombosFromBackend({ data: [] })).toEqual([]);
  });

  it('normaliza promociones de todos los tipos', () => {
    const base = {
      id: 'p-1',
      nombre: 'Promo',
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-31',
    };

    expect(
      adaptPromotionFromBackend({
        ...base,
        tipo: 'descuento_porcentaje',
        descuento_porcentaje: 15,
      }),
    ).toMatchObject({
      type: 'descuento_porcentaje',
      discountPercentage: 15,
    });
    expect(adaptPromotionFromBackend({ ...base, tipo: 'regalo' })).toMatchObject({
      type: 'regalo',
    });
    expect(adaptPromotionFromBackend({ ...base, tipo: 'otro' })).toMatchObject({ type: '2x1' });
    expect(adaptPromotionFromBackend({ ...base, id: null })).toBeNull();
    expect(adaptPromotionFromBackend(null)).toBeNull();
    expect(adaptPromotionsFromBackend(null)).toEqual([]);
  });

  it('normaliza movimientos con aliases y defaults', () => {
    expect(
      adaptMovementFromBackend({
        id: 'm-2',
        empresaId: 'e-1',
        tipo: 'salida',
        motivo: 'Venta',
        referencia: 'R-1',
        ubicacionOrigen: 'A',
        ubicacionDestino: 'B',
        lineas: [null, { sku: '' }, { sku: 'SKU-1', cantidad: '2' }],
        creadoPor: 'user-1',
        creadoEn: '2026-10-27T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: 'm-2',
      type: 'salida',
      origin: 'A',
      destination: 'B',
      lines: [{ sku: 'SKU-1', quantity: 2 }],
      createdBy: 'user-1',
    });
    expect(adaptMovementFromBackend({ id: 'm-3', tipo: 'otro' })).toMatchObject({
      type: 'entrada',
    });
    expect(adaptMovementFromBackend({ id: null })).toBeNull();
    expect(adaptMovementFromBackend(null)).toBeNull();
    expect(adaptMovementsFromBackend(null)).toEqual([]);
  });

  it('infiere el tipo de escaneo y tolera importación vacía', () => {
    expect(adaptScanResultFromBackend({ servicio: SERVICE_FIXTURE })).toMatchObject({
      kind: 'servicio',
    });
    expect(adaptScanResultFromBackend({})).toBeNull();
    expect(adaptScanResultFromBackend(null)).toBeNull();
    expect(
      adaptImportResultFromBackend({ importados: null, omitidos: null, errores: null }),
    ).toEqual({
      imported: 0,
      skipped: 0,
      errors: [],
    });
  });

  it('omite componentes y líneas vacías en los payloads', () => {
    expect(comboToCreatePayload({ ...comboForm, components: [] })).toMatchObject({
      componentes: [],
    });
    expect(
      promotionToPayload({ ...promotionForm, productId: '', sku: '', requiredQuantity: null }),
    ).not.toHaveProperty('producto_id');
    expect(movementToPayload({ ...movementForm, lines: [] })).toMatchObject({ lineas: [] });
  });

  it('parsea encabezados alternativos y limita filas', () => {
    const csv = [
      'name,sku,basePrice,stock,cost,min_stock,max_stock,unit,materia_prima,location',
      'Café,SKU-1,100,1,50,0,10,Caja,si,A-1',
    ].join('\n');
    expect(parseProductsCsv(csv).rows[0]).toMatchObject({
      name: 'Café',
      basePrice: '100',
      cost: '50',
      unit: 'Caja',
      maxStock: 10,
      isRawMaterial: true,
      location: 'A-1',
    });

    const tooMany = ['nombre,sku,precio_venta,stock_inicial']
      .concat(Array.from({ length: 201 }, (_, index) => `P${index},SKU-${index},10,1`))
      .join('\n');
    const result = parseProductsCsv(tooMany);
    expect(result.rows).toHaveLength(200);
    expect(result.errors[0]).toContain('200 filas');
  });
});

describe('company-catalog-operations adapter · listas directas', () => {
  it('acepta arrays directos y filtra errores nulos', () => {
    expect(adaptCombosFromBackend([{ id: 'c-1', sku: 'C-1', nombre: 'Combo' }])).toHaveLength(1);
    expect(adaptPromotionsFromBackend([{ id: 'p-1', nombre: 'Promo' }])).toHaveLength(1);
    expect(adaptMovementsFromBackend([{ id: 'm-1', tipo: 'entrada' }])).toHaveLength(1);
    expect(
      adaptImportResultFromBackend({ importados: 1, omitidos: 0, errores: ['a', null] }),
    ).toEqual({
      imported: 1,
      skipped: 0,
      errors: ['a'],
    });
  });
});

describe('company-catalog-operations adapter · etiquetas', () => {
  it('etiqueta todos los tipos de promoción y su detalle', () => {
    expect(promotionTypeLabel('2x1')).toBe('2 × 1');
    expect(promotionTypeLabel('descuento_cantidad')).toBe('Descuento por cantidad');
    expect(promotionTypeLabel('descuento_porcentaje')).toBe('Descuento %');
    expect(promotionTypeLabel('regalo')).toBe('Regalo');

    expect(
      promotionDetailLabel({
        ...promoSample,
        type: 'descuento_porcentaje',
        discountPercentage: null,
      }),
    ).toBe('—');
    expect(
      promotionDetailLabel({
        ...promoSample,
        type: 'descuento_porcentaje',
        discountPercentage: 15,
      }),
    ).toBe('15 %');
    expect(promotionDetailLabel({ ...promoSample, type: '2x1', sku: '' })).toBe(
      'Todos los productos',
    );
    expect(promotionDetailLabel({ ...promoSample, type: '2x1', sku: 'SKU-1' })).toBe('SKU-1');
    expect(
      promotionDetailLabel({
        ...promoSample,
        type: 'regalo',
        requiredQuantity: 2,
        freeQuantity: 1,
        sku: 'SKU-1',
      }),
    ).toBe('2 × 1 · SKU-1');
    expect(
      promotionDetailLabel({
        ...promoSample,
        type: 'regalo',
        requiredQuantity: null,
        freeQuantity: null,
        sku: '',
      }),
    ).toBe('0 × 0');
  });

  it('etiqueta todos los tipos de movimiento y escaneo sin tipo', () => {
    expect(movementTypeLabel('entrada')).toBe('Entrada');
    expect(movementTypeLabel('salida')).toBe('Salida');
    expect(movementTypeLabel('ajuste')).toBe('Ajuste');
    expect(movementTypeLabel('traslado')).toBe('Traslado');

    expect(adaptScanResultFromBackend({ producto: CATALOG_PRODUCT_FIXTURE })).toMatchObject({
      kind: 'producto',
    });
    expect(
      adaptScanResultFromBackend({ tipo: 'servicio', producto: CATALOG_PRODUCT_FIXTURE }),
    ).toBeNull();
    expect(adaptScanResultFromBackend({ tipo: 'producto', servicio: SERVICE_FIXTURE })).toBeNull();
  });
});
