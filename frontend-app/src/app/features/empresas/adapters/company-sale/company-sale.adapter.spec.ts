import type { OrderResponse } from '../../../cart/public-api';
import type { Client } from '../../../clients/public-api';
import type { CompanySalesAccount } from '../../models/company-sales.model';
import type {
  CompanySaleFilters,
  CompanySaleRecord,
  CompanySaleRow,
} from '../../models/company-sale.model';
import type { CompanyStore } from '../../models/company-store.model';
import {
  buildCompanySaleRows,
  buildRecurringClients,
  companySalePaymentLabel,
  companySalePeriodRange,
  computeCompanySaleKpis,
  createCompanySaleId,
  createCompanySaleRecord,
  filterCompanySaleRows,
  nextCompanySaleNumber,
  sanitizeCompanySaleRecords,
} from './company-sale.adapter';

const NOW = new Date(2026, 9, 27, 12, 0, 0);

function daysAgo(days: number): string {
  return new Date(2026, 9, 27 - days, 12, 0, 0).toISOString();
}

function saleRecord(overrides: Partial<CompanySaleRecord> = {}): CompanySaleRecord {
  return {
    id: 'sale-1',
    number: 'V-000001',
    createdAt: daysAgo(1),
    clientId: null,
    clientName: 'Consumidor final',
    phone: '',
    email: '',
    company: '',
    paymentMethod: 'efectivo',
    status: 'pagada',
    lines: [
      {
        id: 'line-1',
        kind: 'product',
        referenceId: 'p-1',
        code: 'SKU-1',
        name: 'Café',
        quantity: 2,
        unitPrice: 100,
        subtotal: 200,
      },
    ],
    subtotal: 200,
    discount: 0,
    total: 200,
    profit: 0,
    notes: '',
    providerName: 'Tienda Norte',
    ...overrides,
  };
}

function order(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 'o-1',
    orderNumber: 'ORD-1',
    status: 'pagada',
    total: 300,
    createdAt: daysAgo(1),
    buyerId: 'buyer-1',
    storeId: 'store-1',
    items: [
      {
        ofertaId: 'of-1',
        sku: 'SKU-1',
        name: 'Café',
        quantity: 2,
        unitPrice: 150,
        storeId: 'store-1',
      },
    ],
    ...overrides,
  };
}

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: 'buyer-buyer-1',
    buyerId: 'buyer-1',
    name: 'Carla López',
    phone: '8888',
    email: 'carla@correo.com',
    company: 'Norte',
    source: 'order',
    createdAt: daysAgo(40),
    ordersCount: 3,
    totalSpent: 600,
    averageTicket: 200,
    firstPurchaseAt: daysAgo(60),
    lastPurchaseAt: daysAgo(2),
    isActive: true,
    isNew: false,
    isFrequent: true,
    isInactive: false,
    status: 'frecuente',
    ...overrides,
  };
}

function store(overrides: Partial<CompanyStore> = {}): CompanyStore {
  return {
    id: 'store-1',
    companyId: 'company-1',
    ownerUserId: 'u-1',
    sellerId: '',
    name: 'Tienda Norte',
    description: '',
    participationPercentage: 10,
    createdAt: daysAgo(100),
    ...overrides,
  };
}

function row(overrides: Partial<CompanySaleRow> = {}): CompanySaleRow {
  return {
    id: 'row-1',
    number: 'V-000001',
    date: daysAgo(1),
    clientName: 'Carla López',
    paymentLabel: 'Efectivo',
    paymentGroup: 'cash',
    productsLabel: 'Café',
    providerName: 'Tienda Norte',
    total: 200,
    profit: 20,
    status: 'pagada',
    statusLabel: 'Pagada',
    source: 'local',
    ...overrides,
  };
}

describe('company-sale.adapter', () => {
  describe('companySalePaymentLabel', () => {
    it('debe devolver la etiqueta legible de cada forma de pago', () => {
      expect(companySalePaymentLabel('efectivo')).toBe('Efectivo');
      expect(companySalePaymentLabel('separado')).toBe('Pago separado');
      expect(companySalePaymentLabel('paypal')).toBe('PayPal');
    });
  });

  describe('companySalePeriodRange', () => {
    it('debe calcular hoy, semana, mes y año', () => {
      expect(companySalePeriodRange('today', '', '', NOW)).toEqual({
        from: new Date(2026, 9, 27).getTime(),
        to: new Date(2026, 9, 28).getTime() - 1,
      });
      expect(companySalePeriodRange('week', '', '', NOW).from).toBe(
        new Date(2026, 9, 26).getTime(),
      );
      expect(companySalePeriodRange('month', '', '', NOW).from).toBe(
        new Date(2026, 9, 1).getTime(),
      );
      expect(companySalePeriodRange('year', '', '', NOW).from).toBe(new Date(2026, 0, 1).getTime());
    });

    it('debe usar las fechas personalizadas y tolerar entradas inválidas', () => {
      expect(companySalePeriodRange('custom', '2026-10-01', '2026-10-15', NOW)).toEqual({
        from: new Date(2026, 9, 1).getTime(),
        to: new Date(2026, 9, 15, 23, 59, 59, 999).getTime(),
      });
      expect(companySalePeriodRange('custom', '', '', NOW)).toEqual({
        from: -Infinity,
        to: Infinity,
      });
      expect(companySalePeriodRange('custom', 'nope', 'nope', NOW)).toEqual({
        from: -Infinity,
        to: Infinity,
      });
    });
  });

  describe('sanitizeCompanySaleRecords', () => {
    it('debe devolver vacío cuando el valor no es un arreglo', () => {
      expect(sanitizeCompanySaleRecords(null)).toEqual([]);
      expect(sanitizeCompanySaleRecords({})).toEqual([]);
    });

    it('debe normalizar una venta válida y recalcular sus totales', () => {
      const [record] = sanitizeCompanySaleRecords([
        {
          ...saleRecord(),
          lines: [
            { kind: 'product', name: 'Café', quantity: 2, unitPrice: 75, subtotal: 1 },
            { kind: 'service', name: 'Instalación', quantity: 1, unitPrice: 50, subtotal: 0 },
          ],
          discount: 20,
          total: 1,
          status: 'otro',
        },
      ]);

      expect(record).toMatchObject({
        subtotal: 200,
        discount: 20,
        total: 180,
        status: 'pagada',
        providerName: 'Tienda Norte',
      });
      expect(record.lines).toHaveLength(2);
    });

    it('debe descartar registros corruptos o sin líneas', () => {
      expect(
        sanitizeCompanySaleRecords([
          null,
          { ...saleRecord(), id: '' },
          { ...saleRecord(), lines: [] },
          { ...saleRecord(), createdAt: 'no-date' },
          { ...saleRecord(), paymentMethod: 'bitcoin' },
          { ...saleRecord(), lines: [{ name: '', quantity: 1, unitPrice: 10 }] },
          { ...saleRecord(), discount: 999 },
        ]),
      ).toEqual([]);
    });

    it('debe limitar el descuento al subtotal y conservar el estado pendiente', () => {
      const [record] = sanitizeCompanySaleRecords([
        saleRecord({ discount: 100, status: 'pendiente', paymentMethod: 'separado' }),
      ]);

      expect(record.discount).toBe(100);
      expect(record.total).toBe(100);
      expect(record.status).toBe('pendiente');
    });
  });

  describe('createCompanySaleRecord', () => {
    const context = {
      id: 'sale-new',
      number: 'V-000010',
      now: NOW.toISOString(),
      providerName: 'Tienda Norte',
    };
    const payload = {
      client: { mode: 'final' as const, name: 'Consumidor final' },
      lines: [
        {
          id: 'line-1',
          kind: 'product' as const,
          referenceId: 'p-1',
          code: 'SKU-1',
          name: 'Café',
          quantity: 2,
          unitPrice: 100,
          subtotal: 200,
        },
      ],
      paymentMethod: 'efectivo' as const,
      date: '2026-10-20',
      discountPercent: 10,
      notes: '  Entregar mañana  ',
    };

    it('debe crear una venta pagada con descuento y cliente final', () => {
      const record = createCompanySaleRecord(payload, context);

      expect(record).toMatchObject({
        id: 'sale-new',
        number: 'V-000010',
        clientName: 'Consumidor final',
        paymentMethod: 'efectivo',
        status: 'pagada',
        subtotal: 200,
        discount: 20,
        total: 180,
        notes: 'Entregar mañana',
        providerName: 'Tienda Norte',
        createdAt: '2026-10-20T00:00:00.000Z',
      });
    });

    it('debe marcar como pendiente el pago separado y usar el cliente rápido', () => {
      const record = createCompanySaleRecord(
        {
          ...payload,
          client: {
            mode: 'quick',
            name: '  Pedro  ',
            phone: ' 8888 ',
            email: ' PEDRO@CORREO.COM ',
          },
          paymentMethod: 'separado',
          discountPercent: 10,
          date: '',
        },
        context,
      );

      expect(record).toMatchObject({
        clientName: 'Pedro',
        phone: '8888',
        email: 'PEDRO@CORREO.COM',
        status: 'pendiente',
        createdAt: context.now,
      });
    });

    it('debe rechazar clientes sin nombre, líneas vacías o total cero', () => {
      expect(
        createCompanySaleRecord({ ...payload, client: { mode: 'quick', name: '   ' } }, context),
      ).toBeNull();
      expect(createCompanySaleRecord({ ...payload, lines: [] }, context)).toBeNull();
      expect(
        createCompanySaleRecord(
          {
            ...payload,
            lines: [{ ...payload.lines[0], unitPrice: 0, subtotal: 0 }],
          },
          context,
        ),
      ).toBeNull();
    });
  });

  describe('nextCompanySaleNumber', () => {
    it('debe continuar la secuencia e ignorar folios inválidos', () => {
      expect(nextCompanySaleNumber([])).toBe('V-000001');
      expect(
        nextCompanySaleNumber([
          saleRecord({ number: 'V-000009' }),
          saleRecord({ number: 'otro' }),
          saleRecord({ number: 'v-000003' }),
        ]),
      ).toBe('V-000010');
    });
  });

  describe('buildCompanySaleRows', () => {
    it('debe combinar órdenes y ventas locales con cliente, tienda y ganancia', () => {
      const salesAccount: CompanySalesAccount = {
        companyId: 'company-1',
        sales: [
          {
            orderId: 'o-1',
            sale: 300,
            commission: 30,
            companyAmount: 270,
            status: 'acreditada',
            date: daysAgo(1),
          },
        ],
        pendingCommissions: 0,
      };

      const rows = buildCompanySaleRows({
        orders: [order()],
        clients: [client()],
        stores: [store()],
        salesAccount,
        localSales: [saleRecord({ id: 'sale-2', number: 'V-000002', createdAt: daysAgo(0) })],
      });

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        number: 'V-000002',
        source: 'local',
        paymentLabel: 'Efectivo',
      });
      expect(rows[1]).toMatchObject({
        number: 'ORD-1',
        clientName: 'Carla López',
        providerName: 'Tienda Norte',
        productsLabel: 'Café',
        profit: 270,
        paymentGroup: 'cash',
        statusLabel: 'Pagada',
      });
    });

    it('debe usar respaldo de cliente y proveedor y clasificar pendientes', () => {
      const rows = buildCompanySaleRows({
        orders: [
          order({
            id: 'o-2',
            orderNumber: 'ORD-2',
            buyerId: undefined,
            storeId: undefined,
            status: 'creada',
          }),
          order({ id: 'o-3', orderNumber: 'ORD-3', buyerId: 'buyer-x', status: 'creada' }),
        ],
        clients: [],
        stores: [],
        salesAccount: null,
        localSales: [
          saleRecord({ paymentMethod: 'separado', status: 'pendiente' }),
          saleRecord({ id: 'sale-3', paymentMethod: 'tarjeta' }),
        ],
      });

      expect(rows.find((item) => item.number === 'ORD-2')).toMatchObject({
        clientName: 'Consumidor final',
        providerName: 'Mi empresa',
        paymentGroup: 'pending',
      });
      expect(rows.find((item) => item.number === 'ORD-3')).toMatchObject({
        clientName: 'Cliente BUYER-X',
        paymentGroup: 'pending',
      });
      expect(rows.find((item) => item.number === 'V-000001')).toMatchObject({
        paymentLabel: 'Pago separado',
        paymentGroup: 'credit',
        statusLabel: 'Pendiente',
      });
    });

    it('debe mostrar el conteo cuando las órdenes no traen nombres de producto', () => {
      const rows = buildCompanySaleRows({
        orders: [
          order({
            items: [
              {
                ofertaId: 'of-1',
                sku: 'SKU-1',
                name: '',
                quantity: 1,
                unitPrice: 10,
                storeId: 'store-1',
              },
              {
                ofertaId: 'of-2',
                sku: 'SKU-2',
                name: '',
                quantity: 1,
                unitPrice: 10,
                storeId: 'store-1',
              },
            ],
          }),
          order({ id: 'o-9', items: [] }),
        ],
        clients: [],
        stores: [],
        salesAccount: null,
        localSales: [],
      });

      expect(rows.find((item) => item.number === 'ORD-1')?.productsLabel).toBe('2 producto(s)');
      expect(rows.find((item) => item.number === 'ORD-1')?.paymentLabel).toBe('No registrado');
    });
  });

  describe('filterCompanySaleRows', () => {
    const base: CompanySaleFilters = {
      period: 'month',
      payment: 'all',
      search: '',
      customFrom: '',
      customTo: '',
      now: NOW,
    };

    it('debe filtrar por hoy, semana, mes y año', () => {
      const rows = [
        row({ id: 'today', date: daysAgo(0) }),
        row({ id: 'yesterday', date: daysAgo(1) }),
        row({ id: 'last-week', date: daysAgo(4) }),
        row({ id: 'last-month', date: daysAgo(40) }),
        row({ id: 'last-year', date: daysAgo(400) }),
        row({ id: 'invalid', date: 'nope' }),
      ];

      expect(
        filterCompanySaleRows(rows, { ...base, period: 'today' }).map((item) => item.id),
      ).toEqual(['today']);
      expect(
        filterCompanySaleRows(rows, { ...base, period: 'week' }).map((item) => item.id),
      ).toEqual(['today', 'yesterday']);
      expect(
        filterCompanySaleRows(rows, { ...base, period: 'month' }).map((item) => item.id),
      ).toEqual(['today', 'yesterday', 'last-week']);
      expect(
        filterCompanySaleRows(rows, { ...base, period: 'year' }).map((item) => item.id),
      ).toEqual(['today', 'yesterday', 'last-week', 'last-month']);
    });

    it('debe filtrar por rango personalizado y por forma de pago', () => {
      const rows = [
        row({ id: 'cash', paymentGroup: 'cash', date: daysAgo(2) }),
        row({ id: 'credit', paymentGroup: 'credit', date: daysAgo(2) }),
        row({ id: 'pending', paymentGroup: 'pending', date: daysAgo(2) }),
      ];
      const custom = {
        ...base,
        period: 'custom' as const,
        customFrom: '2026-10-20',
        customTo: '2026-10-26',
      };

      expect(filterCompanySaleRows(rows, custom)).toHaveLength(3);
      expect(filterCompanySaleRows(rows, { ...base, payment: 'cash' })).toHaveLength(1);
      expect(
        filterCompanySaleRows(rows, { ...base, payment: 'credit' }).map((item) => item.id),
      ).toEqual(['credit']);
      expect(
        filterCompanySaleRows(rows, { ...base, payment: 'pending' }).map((item) => item.id),
      ).toEqual(['credit', 'pending']);
    });

    it('debe buscar sin distinguir mayúsculas ni acentos', () => {
      const rows = [
        row({ id: 'carla', clientName: 'Carla López', productsLabel: 'Café molido' }),
        row({ id: 'pedro', clientName: 'Pedro Ruiz', number: 'V-000099', productsLabel: 'Arroz' }),
      ];

      expect(
        filterCompanySaleRows(rows, { ...base, search: 'LOPEZ' }).map((item) => item.id),
      ).toEqual(['carla']);
      expect(
        filterCompanySaleRows(rows, { ...base, search: 'cafe' }).map((item) => item.id),
      ).toEqual(['carla']);
      expect(
        filterCompanySaleRows(rows, { ...base, search: 'V-000099' }).map((item) => item.id),
      ).toEqual(['pedro']);
    });
  });

  describe('computeCompanySaleKpis', () => {
    it('debe calcular ventas del día/mes, cantidad, ticket y ganancia', () => {
      const rows = [
        row({ id: 'today-1', date: daysAgo(0), total: 100, profit: 10 }),
        row({ id: 'today-2', date: daysAgo(0), total: 50, profit: 5 }),
        row({ id: 'month', date: daysAgo(5), total: 200, profit: 20 }),
        row({ id: 'old', date: daysAgo(40), total: 999, profit: 90 }),
        row({
          id: 'cancelled',
          date: daysAgo(0),
          total: 500,
          profit: 50,
          source: 'order',
          status: 'cancelada',
        }),
      ];

      expect(computeCompanySaleKpis(rows, NOW)).toEqual({
        todaySales: 150,
        monthSales: 350,
        monthCount: 3,
        averageTicket: 116.67,
        estimatedProfit: 35,
      });
    });

    it('debe devolver ceros sin ventas en el mes', () => {
      expect(computeCompanySaleKpis([row({ date: daysAgo(40) })], NOW)).toEqual({
        todaySales: 0,
        monthSales: 0,
        monthCount: 0,
        averageTicket: 0,
        estimatedProfit: 0,
      });
    });
  });

  describe('buildRecurringClients', () => {
    it('debe incluir solo clientes frecuentes y calcular su próxima fecha', () => {
      const clients = [
        client({
          id: 'c-1',
          name: 'Carla',
          ordersCount: 4,
          firstPurchaseAt: daysAgo(90),
          lastPurchaseAt: daysAgo(0),
        }),
        client({
          id: 'c-2',
          name: 'Pedro',
          ordersCount: 3,
          firstPurchaseAt: daysAgo(10),
          lastPurchaseAt: daysAgo(0),
        }),
        client({ id: 'c-3', name: 'Sin compras', ordersCount: 1 }),
      ];

      const recurring = buildRecurringClients(clients);

      expect(recurring).toHaveLength(2);
      expect(recurring[0]).toMatchObject({
        name: 'Pedro',
        frequencyLabel: 'Cada 5 días',
        amountDue: 200,
        status: 'Activo',
      });
      expect(recurring[1]).toMatchObject({ name: 'Carla', frequencyLabel: 'Mensual' });
      expect(recurring[1].nextPaymentAt).not.toBeNull();
    });

    it('debe marcar inactivos y limitar a seis clientes', () => {
      const clients = Array.from({ length: 7 }, (_, index) =>
        client({
          id: `c-${index}`,
          name: `Cliente ${index}`,
          ordersCount: 3,
          isActive: false,
          firstPurchaseAt: daysAgo(60 + index),
        }),
      );

      const recurring = buildRecurringClients(clients);

      expect(recurring).toHaveLength(6);
      expect(recurring[0].status).toBe('Inactivo');
    });
  });

  describe('ids', () => {
    it('debe generar ids con el prefijo esperado', () => {
      expect(createCompanySaleId()).toMatch(/^sale-/);
    });
  });
});
