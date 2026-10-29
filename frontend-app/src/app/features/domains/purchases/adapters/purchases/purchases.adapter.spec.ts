import {
  buildPurchaseHistoryRows,
  buildPurchaseOrderRows,
  buildPurchaseReport,
  buildPurchaseReportHtml,
  buildSupplierRows,
  computePurchaseKpis,
  createDirectPurchaseRecord,
  createNewProductPurchaseRecord,
  createPurchaseLine,
  createPurchaseOrder,
  createPurchaseRecord,
  createSupplier,
  filterPurchaseRecords,
  isPurchaseInPeriod,
  migrateFinancePurchases,
  nextDocumentNumber,
  purchasePageCount,
  purchaseReportCsv,
  sanitizePurchaseDocumentSettings,
  sanitizePurchaseOrders,
  sanitizePurchaseRecords,
  sanitizeSuppliers,
} from './purchases.adapter';
import type {
  PurchaseDocumentSettings,
  PurchaseOrder,
  PurchaseRecord,
  PurchaseReportOptions,
  Supplier,
} from '../../models/purchase.model';

const NOW = new Date(2026, 9, 29, 12, 0, 0);
const TODAY = '2026-10-29';

function line(name = 'Producto', quantity = 2, unitCost = 10) {
  return { name, quantity, unitCost };
}

function record(overrides: Partial<PurchaseRecord> = {}): PurchaseRecord {
  return {
    id: 'purchase-1',
    number: 'C-0001',
    date: TODAY,
    supplierId: 'supplier-1',
    supplierName: 'Distribuidora',
    paymentMethod: 'efectivo',
    status: 'recibida',
    origin: 'productos',
    costType: 'inventario',
    lines: [
      {
        id: 'line-1',
        productId: 'product-1',
        name: 'Taladro',
        sku: 'TAL-1',
        quantity: 2,
        unitCost: 100,
        salePrice: 150,
      },
    ],
    subtotal: 200,
    retention: 0,
    total: 200,
    notes: '',
    userName: 'Karla',
    createdAt: `${TODAY}T12:00:00.000Z`,
    ...overrides,
  };
}

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 'supplier-1',
    name: 'Distribuidora',
    ruc: '123',
    phone: '8888',
    email: '',
    address: '',
    createdAt: `${TODAY}T12:00:00.000Z`,
    ...overrides,
  };
}

function order(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: 'order-1',
    number: 'OC-0001',
    date: TODAY,
    supplierId: 'supplier-1',
    supplierName: 'Distribuidora',
    lines: [
      {
        id: 'line-1',
        productId: 'product-1',
        name: 'Taladro',
        sku: 'TAL-1',
        quantity: 3,
        unitCost: 100,
        salePrice: 150,
      },
    ],
    total: 300,
    status: 'pendiente',
    notes: '',
    createdAt: `${TODAY}T12:00:00.000Z`,
    ...overrides,
  };
}

const REPORT_OPTIONS: PurchaseReportOptions = {
  period: 'personalizado',
  customFrom: TODAY,
  customTo: TODAY,
  status: 'activas',
  type: 'todas',
  payment: 'todas',
  includeProducts: true,
  supplierIds: [],
};

const SETTINGS: PurchaseDocumentSettings = {
  logoSize: 'mediano',
  headerColor: '#0055FF',
  matchTableColor: true,
  footerMessage: 'Gracias',
  showRuc: true,
  showAddress: true,
  showPhone: true,
};

describe('purchases adapter', () => {
  it('crea líneas válidas y descarta líneas incompletas', () => {
    expect(createPurchaseLine(line('  Taladro  ', 2, 15))).toMatchObject({
      name: 'Taladro',
      quantity: 2,
      unitCost: 15,
    });
    expect(createPurchaseLine(line('', 2, 15))).toBeNull();
    expect(createPurchaseLine(line('Taladro', 0, 15))).toBeNull();
    expect(createPurchaseLine(line('Taladro', 1, -1))).toBeNull();
  });

  it('calcula el siguiente número correlativo', () => {
    expect(nextDocumentNumber([], 'C')).toBe('C-0001');
    expect(nextDocumentNumber([{ number: 'C-0009' }, { number: 'C-0010' }], 'C')).toBe('C-0011');
    expect(nextDocumentNumber([{ number: 'OC-0003' }], 'OC')).toBe('OC-0004');
  });

  it('construye compras válidas y acota la retención', () => {
    const created = createPurchaseRecord(
      {
        date: TODAY,
        supplierName: '  Distribuidora  ',
        paymentMethod: 'transferencia',
        status: 'recibida',
        origin: 'productos',
        costType: 'inventario',
        lines: [line()],
        retention: 999,
      },
      'C-0001',
    );

    expect(created).toMatchObject({
      number: 'C-0001',
      supplierName: 'Distribuidora',
      status: 'recibida',
      subtotal: 20,
      total: 20,
      retention: 6,
      paymentMethod: 'transferencia',
    });
  });

  it('rechaza compras inválidas', () => {
    const base = {
      date: TODAY,
      supplierName: 'Proveedor',
      paymentMethod: 'efectivo' as const,
      status: 'recibida' as const,
      origin: 'productos' as const,
      costType: 'inventario' as const,
      lines: [line()],
    };
    expect(createPurchaseRecord({ ...base, date: '' }, 'C-1')).toBeNull();
    expect(createPurchaseRecord({ ...base, lines: [] }, 'C-1')).toBeNull();
    expect(createPurchaseRecord({ ...base, lines: [line('', 1, 1)] }, 'C-1')).toBeNull();
    expect(createPurchaseRecord({ ...base, status: 'otro' as never }, 'C-1')).toBeNull();
    expect(createPurchaseRecord({ ...base, origin: 'otro' as never }, 'C-1')).toBeNull();
    expect(createPurchaseRecord({ ...base, costType: 'invalido' as never }, 'C-1')).toBeNull();
    expect(createPurchaseRecord({ ...base, paymentMethod: 'invalido' as never }, 'C-1')).toBeNull();
  });

  it('construye compras directas y de producto nuevo', () => {
    expect(
      createDirectPurchaseRecord(
        {
          date: TODAY,
          concept: 'Reparación',
          costType: 'servicio',
          amount: 80,
          paymentMethod: 'efectivo',
        },
        'C-0002',
      ),
    ).toMatchObject({
      origin: 'directa',
      costType: 'servicio',
      supplierName: 'Sin proveedor',
      total: 80,
      status: 'recibida',
    });
    expect(
      createDirectPurchaseRecord(
        {
          date: TODAY,
          concept: '',
          costType: 'servicio',
          amount: 80,
          paymentMethod: 'efectivo',
        },
        'C-0002',
      ),
    ).toBeNull();
    expect(
      createDirectPurchaseRecord(
        {
          date: TODAY,
          concept: 'Reparación',
          costType: 'servicio',
          amount: 0,
          paymentMethod: 'efectivo',
        },
        'C-0002',
      ),
    ).toBeNull();

    expect(
      createNewProductPurchaseRecord(
        {
          date: TODAY,
          productName: 'Taladro',
          category: 'Herramientas',
          sku: 'TAL-1',
          paymentMethod: 'efectivo',
          unitCost: 100,
          salePrice: 150,
          quantity: 3,
        },
        'C-0003',
      ),
    ).toMatchObject({
      origin: 'productos',
      costType: 'inventario',
      total: 300,
      notes: 'Herramientas',
    });
    expect(
      createNewProductPurchaseRecord(
        {
          date: TODAY,
          productName: '',
          paymentMethod: 'efectivo',
          unitCost: 100,
          salePrice: 150,
          quantity: 3,
        },
        'C-0003',
      ),
    ).toBeNull();
  });

  it('construye órdenes y proveedores válidos', () => {
    expect(
      createPurchaseOrder(
        {
          date: TODAY,
          supplierName: 'Distribuidora',
          lines: [line()],
        },
        'OC-0001',
      ),
    ).toMatchObject({ number: 'OC-0001', total: 20, status: 'pendiente' });
    expect(
      createPurchaseOrder({ date: '', supplierName: 'X', lines: [line()] }, 'OC-1'),
    ).toBeNull();
    expect(createPurchaseOrder({ date: TODAY, supplierName: 'X', lines: [] }, 'OC-1')).toBeNull();
    expect(createSupplier({ name: '' })).toBeNull();
    expect(createSupplier({ name: '  Proveedor  ' })).toMatchObject({ name: 'Proveedor' });
  });

  it('sanea compras, órdenes, proveedores y preferencias', () => {
    expect(sanitizePurchaseRecords([record(), { id: '' }])).toHaveLength(1);
    expect(sanitizePurchaseOrders([order(), { id: '' }])).toHaveLength(1);
    expect(sanitizeSuppliers([supplier(), { id: '' }])).toHaveLength(1);
    expect(sanitizePurchaseRecords('nope')).toEqual([]);

    expect(
      sanitizePurchaseDocumentSettings({
        logoSize: 'grande',
        headerColor: '#abcdef',
        matchTableColor: false,
        footerMessage: '  Hola  ',
        showRuc: false,
        showAddress: false,
        showPhone: false,
      }),
    ).toEqual({
      logoSize: 'grande',
      headerColor: '#ABCDEF',
      matchTableColor: false,
      footerMessage: 'Hola',
      showRuc: false,
      showAddress: false,
      showPhone: false,
    });
    expect(sanitizePurchaseDocumentSettings({ headerColor: 'rojo' })).toMatchObject({
      logoSize: 'mediano',
      headerColor: '#0055FF',
      showRuc: true,
    });
    expect(sanitizePurchaseDocumentSettings(null)).toEqual({
      logoSize: 'mediano',
      headerColor: '#0055FF',
      matchTableColor: true,
      footerMessage: '',
      showRuc: true,
      showAddress: true,
      showPhone: true,
    });
  });

  it('migra compras heredadas de finanzas', () => {
    const migrated = migrateFinancePurchases([
      {
        id: 'old-1',
        date: TODAY,
        supplier: 'Proveedor',
        concept: 'Compra',
        amount: 50,
        status: 'pagada',
      },
      {
        id: 'old-2',
        date: TODAY,
        supplier: 'Proveedor 2',
        concept: 'Compra 2',
        amount: 30,
        status: 'pendiente',
      },
      { id: 'old-3', date: '', supplier: 'X', concept: 'X', amount: 10, status: 'pagada' },
    ]);
    expect(migrated).toHaveLength(2);
    expect(migrated[0]).toMatchObject({ number: 'C-0001', status: 'recibida', total: 50 });
    expect(migrated[1]).toMatchObject({ number: 'C-0002', status: 'pendiente' });
    expect(migrateFinancePurchases(null)).toEqual([]);
  });

  it('evalúa los periodos de fecha', () => {
    expect(isPurchaseInPeriod(TODAY, 'hoy', '', '', NOW)).toBe(true);
    expect(isPurchaseInPeriod('2026-10-26', 'semana', '', '', NOW)).toBe(true);
    expect(isPurchaseInPeriod('2026-10-19', 'semana', '', '', NOW)).toBe(false);
    expect(isPurchaseInPeriod('2026-10-01', 'mes', '', '', NOW)).toBe(true);
    expect(isPurchaseInPeriod('2026-01-01', 'año', '', '', NOW)).toBe(true);
    expect(isPurchaseInPeriod('2027-01-01', 'año', '', '', NOW)).toBe(false);
    expect(isPurchaseInPeriod('2026-10-15', 'personalizado', '2026-10-01', '2026-10-20', NOW)).toBe(
      true,
    );
    expect(isPurchaseInPeriod('2026-09-25', 'personalizado', '2026-10-01', '', NOW)).toBe(false);
    expect(isPurchaseInPeriod('bad', 'mes', '', '', NOW)).toBe(false);
  });

  it('filtra por periodo, estado, tipo, pago, proveedor y búsqueda', () => {
    const records = [
      record(),
      record({
        id: 'p2',
        number: 'C-0002',
        supplierId: 'supplier-2',
        supplierName: 'Ferretería',
        origin: 'directa',
        status: 'anulada',
        paymentMethod: 'credito',
        lines: [
          {
            id: 'l2',
            productId: null,
            name: 'Mantenimiento',
            sku: '',
            quantity: 1,
            unitCost: 50,
            salePrice: null,
          },
        ],
      }),
    ];

    expect(filterPurchaseRecords(records, { period: 'mes', now: NOW })).toHaveLength(2);
    expect(
      filterPurchaseRecords(records, { period: 'mes', status: 'activas', now: NOW }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, { period: 'mes', status: 'anuladas', now: NOW }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, { period: 'mes', status: 'recibida', now: NOW }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, { period: 'mes', type: 'directas', now: NOW }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, { period: 'mes', type: 'productos', now: NOW }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, { period: 'mes', payment: 'credito', now: NOW }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, {
        period: 'mes',
        supplierIds: ['supplier-2'],
        now: NOW,
      }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, {
        period: 'mes',
        supplierNames: ['distribuidora'],
        now: NOW,
      }),
    ).toHaveLength(1);
    expect(
      filterPurchaseRecords(records, { period: 'mes', query: 'taladro', now: NOW }),
    ).toHaveLength(1);
    expect(filterPurchaseRecords(records, { period: 'mes', query: 'nada', now: NOW })).toHaveLength(
      0,
    );
  });

  it('calcula los KPIs de compras', () => {
    const kpis = computePurchaseKpis(
      [
        record({ id: 'p1', total: 200, subtotal: 200 }),
        record({ id: 'p2', date: '2026-10-01', total: 100 }),
        record({ id: 'p3', total: 500, status: 'anulada' }),
        record({
          id: 'p4',
          total: 80,
          origin: 'directa',
          lines: [
            {
              id: 'l4',
              productId: null,
              name: 'Servicio',
              sku: '',
              quantity: 1,
              unitCost: 80,
              salePrice: null,
            },
          ],
        }),
      ],
      NOW,
    );
    expect(kpis).toEqual({
      todayTotal: 280,
      todayCount: 2,
      monthTotal: 380,
      monthCount: 3,
      totalCount: 3,
      cancelledCount: 1,
      productsEntered: 4,
      inventoryInvestment: 300,
      activeSuppliers: 1,
    });
  });

  it('construye filas del historial y de proveedores', () => {
    const rows = buildPurchaseHistoryRows([
      record({ id: 'p1', date: '2026-10-01' }),
      record({
        id: 'p2',
        date: TODAY,
        lines: [
          ...record().lines,
          {
            id: 'l2',
            productId: null,
            name: 'Servicio',
            sku: '',
            quantity: 1,
            unitCost: 20,
            salePrice: null,
          },
        ],
      }),
    ]);
    expect(rows[0].productsLabel).toBe('Taladro +1');
    expect(rows[0].units).toBe(3);
    expect(rows[1].productsLabel).toBe('Taladro');
    expect(rows[0].userName).toBe('Karla');

    const supplierRows = buildSupplierRows(
      [supplier()],
      [
        record(),
        record({ id: 'p2', supplierId: null, supplierName: 'Ferretería' }),
        record({ id: 'p3', status: 'anulada' }),
      ],
    );
    expect(supplierRows.map((row) => row.name)).toEqual(['Distribuidora', 'Ferretería']);
    expect(supplierRows[0]).toMatchObject({ purchaseCount: 1, total: 200 });
    expect(supplierRows[1]).toMatchObject({ purchaseCount: 1, total: 200 });
  });

  it('construye filas de órdenes y páginas', () => {
    const rows = buildPurchaseOrderRows([order(), order({ id: 'o2', date: '2026-10-01' })]);
    expect(rows[0].date).toBe(TODAY);
    expect(rows[0].productsLabel).toBe('Taladro');
    expect(rows[0].units).toBe(3);
    expect(purchasePageCount(0)).toBe(1);
    expect(purchasePageCount(9)).toBe(2);
  });

  it('calcula el reporte, CSV y HTML imprimible', () => {
    const report = buildPurchaseReport([record(), record({ id: 'p2', status: 'anulada' })], {
      ...REPORT_OPTIONS,
    });
    expect(report.count).toBe(1);
    expect(report.total).toBe(200);
    expect(report.productLines).toEqual([{ name: 'Taladro', quantity: 2, total: 200 }]);

    const csv = purchaseReportCsv(report, true);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('N° compra;Fecha;Proveedor');
    expect(csv).toContain('Taladro');
    expect(csv).toContain('Producto;Cantidad;Total');

    const html = buildPurchaseReportHtml(report, SETTINGS, '<Empresa & Cía>', REPORT_OPTIONS);
    expect(html).toContain('&lt;Empresa &amp; Cía&gt;');
    expect(html).toContain('#0055FF');
    expect(html).toContain('Gracias');
    expect(html).toContain('RUC');

    const minimal = buildPurchaseReportHtml(
      report,
      { ...SETTINGS, showRuc: false, showAddress: false, showPhone: false, footerMessage: '' },
      'Empresa',
      REPORT_OPTIONS,
    );
    expect(minimal).not.toContain('RUC:');
  });

  it('mantiene totales coherentes al sancionar registros', () => {
    const sanitized = sanitizePurchaseRecords([record({ subtotal: 1, total: 1, retention: 999 })]);
    expect(sanitized[0]).toMatchObject({
      subtotal: 200,
      total: 200,
      retention: 60,
    });
  });
});
