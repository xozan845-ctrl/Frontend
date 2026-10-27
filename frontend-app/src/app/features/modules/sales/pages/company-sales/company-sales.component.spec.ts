import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanySalesComponent from './company-sales.component';
import {
  CompanySalesStore,
  CompanyServicesStore,
  type CompanyRecurringClient,
  type CompanySaleKpis,
  type CompanySalePaymentFilter,
  type CompanySalePeriod,
  type CompanySaleRow,
  type CompanyServiceModel,
  type CreateCompanySalePayload,
} from '../../../../empresas/public-api';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { AuthStore } from '../../../../auth/public-api';
import type { CatalogProduct } from '../../../../products/public-api';

const row: CompanySaleRow = {
  id: 'sale-1',
  number: 'V-001163',
  date: '2026-10-27T12:00:00.000Z',
  clientName: 'Carla López',
  paymentLabel: 'Efectivo',
  paymentGroup: 'cash',
  productsLabel: 'Café, Instalación',
  providerName: 'Tienda Norte',
  total: 450,
  profit: 45,
  status: 'pagada',
  statusLabel: 'Pagada',
  source: 'local',
};

const recurring: CompanyRecurringClient = {
  id: 'c-1',
  name: 'Carla López',
  frequencyLabel: 'Mensual',
  lastPaymentAt: '2026-09-27T12:00:00.000Z',
  nextPaymentAt: '2026-10-27T12:00:00.000Z',
  amountDue: 450,
  status: 'Activo',
};

const kpis: CompanySaleKpis = {
  todaySales: 450,
  monthSales: 900,
  monthCount: 2,
  averageTicket: 450,
  estimatedProfit: 90,
};

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'empresa-1',
  sku: 'SKU-1',
  name: 'Café',
  description: '',
  category: 'Bebidas',
  basePrice: 150,
  stock: 10,
  status: 'disponible',
  createdAt: '2026-09-01T12:00:00.000Z',
};

const service: CompanyServiceModel = {
  id: 'srv-1',
  companyId: 'empresa-1',
  code: 'SRV-1',
  name: 'Instalación',
  description: '',
  category: 'Soporte',
  brand: '',
  barcode: '',
  price: 300,
  cost: 0,
  unit: 'Hora (h)',
  durationMinutes: 60,
  status: 'activo',
  createdAt: '2026-09-01T12:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

describe('CompanySalesComponent', () => {
  const rows = signal<CompanySaleRow[]>([row]);
  const filtered = signal<CompanySaleRow[]>([row]);
  const kpi = signal<CompanySaleKpis>(kpis);
  const recurringClients = signal<CompanyRecurringClient[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const period = signal<CompanySalePeriod>('month');
  const payment = signal<CompanySalePaymentFilter>('all');
  const search = signal('');
  const customFrom = signal('');
  const customTo = signal('');
  const page = signal(1);
  const totalPages = signal(1);
  const products = signal<CatalogProduct[]>([product]);
  const clients = signal([]);

  const store = {
    error: error.asReadonly(),
    loading: loading.asReadonly(),
    kpis: kpi.asReadonly(),
    recurringClients: recurringClients.asReadonly(),
    filteredCount: computed(() => filtered().length),
    period: period.asReadonly(),
    payment: payment.asReadonly(),
    search: search.asReadonly(),
    customFrom: customFrom.asReadonly(),
    customTo: customTo.asReadonly(),
    hasRows: computed(() => rows().length > 0),
    hasFilteredRows: computed(() => filtered().length > 0),
    pageCount: totalPages.asReadonly(),
    currentPage: computed(() => Math.min(page(), totalPages())),
    isFirstPage: computed(() => Math.min(page(), totalPages()) === 1),
    isLastPage: computed(() => Math.min(page(), totalPages()) >= totalPages()),
    pagedRows: computed(() => filtered().slice((page() - 1) * 10, page() * 10)),
    activeProducts: computed(() => products().filter((item) => item.status === 'disponible')),
    clients: clients.asReadonly(),
    nextNumber: signal('V-001164').asReadonly(),
    loadOrders: vi.fn(),
    loadProducts: vi.fn(),
    loadStores: vi.fn(),
    loadSales: vi.fn(),
    setSearch: vi.fn((value: string) => search.set(value)),
    setPeriod: vi.fn((value: CompanySalePeriod) => period.set(value)),
    setPayment: vi.fn((value: CompanySalePaymentFilter) => payment.set(value)),
    setCustomFrom: vi.fn((value: string) => customFrom.set(value)),
    setCustomTo: vi.fn((value: string) => customTo.set(value)),
    previousPage: vi.fn(() => page.set(Math.max(1, page() - 1))),
    nextPage: vi.fn(() => page.set(Math.min(totalPages(), page() + 1))),
    createSale: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
  };

  const servicesStore = { services: signal([service]).asReadonly() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };
  const auth = {
    user: computed(() => ({
      id: 'u-1',
      email: 'karla@empresa.com',
      name: 'Karla Ruiz',
      tenantId: 'empresa-1',
    })),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanySalesComponent],
      providers: [
        provideRouter([]),
        { provide: CompanySalesStore, useValue: store },
        { provide: CompanyServicesStore, useValue: servicesStore },
        { provide: SeoService, useValue: seo },
        { provide: AuthStore, useValue: auth },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanySalesComponent);
    fixture.detectChanges();
    return fixture;
  };

  const query = (fixture: Awaited<ReturnType<typeof setup>>, testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;

  const type = (fixture: Awaited<ReturnType<typeof setup>>, testId: string, value: string) => {
    const field = query(fixture, testId) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rows.set([row]);
    filtered.set([row]);
    kpi.set(kpis);
    recurringClients.set([]);
    loading.set(false);
    error.set(null);
    period.set('month');
    payment.set('all');
    search.set('');
    customFrom.set('');
    customTo.set('');
    page.set(1);
    totalPages.set(1);
    products.set([product]);
    TestBed.resetTestingModule();
  });

  it('debe cargar ventas, productos, tiendas y estado de cuenta al crear la página', async () => {
    await setup();

    expect(store.loadOrders).toHaveBeenCalled();
    expect(store.loadProducts).toHaveBeenCalled();
    expect(store.loadStores).toHaveBeenCalled();
    expect(store.loadSales).toHaveBeenCalled();
  });

  it('debe mostrar saludo, KPIs, historial y estado', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.textContent).toContain('Karla');
    expect(query(fixture, 'company-sales-kpi-today')?.textContent).toContain('C$450.00');
    expect(query(fixture, 'company-sales-kpi-month')?.textContent).toContain('C$900.00');
    expect(query(fixture, 'company-sales-kpi-count')?.textContent).toContain('2');
    expect(query(fixture, 'company-sales-kpi-average')?.textContent).toContain('C$450.00');
    expect(query(fixture, 'company-sales-kpi-profit')?.textContent).toContain('C$90.00');
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="company-sales-row"]'),
    ).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('V-001163');
    expect(fixture.nativeElement.textContent).toContain('Carla López');
    expect(fixture.nativeElement.textContent).toContain('Pagada');
  });

  it('debe mostrar el estado vacío de recurrentes y el enlace a Clientes', async () => {
    const fixture = await setup();

    expect(query(fixture, 'company-recurring-empty')?.textContent).toContain(
      'Aún no tienes clientes marcados',
    );
    expect(fixture.nativeElement.querySelector('a[href="/empresa/clientes"]')).not.toBeNull();
  });

  it('debe renderizar la tabla de recurrentes cuando hay clientes', async () => {
    recurringClients.set([recurring]);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="company-recurring-row"]'),
    ).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Mensual');
    expect(fixture.nativeElement.textContent).toContain('Activo');
  });

  it('debe aplicar periodo, forma de pago y búsqueda', async () => {
    const fixture = await setup();

    query(fixture, 'company-sales-period-today')?.click();
    expect(store.setPeriod).toHaveBeenCalledWith('today');
    query(fixture, 'company-sales-payment-credit')?.click();
    expect(store.setPayment).toHaveBeenCalledWith('credit');
    type(fixture, 'company-sales-search', 'carla');
    expect(store.setSearch).toHaveBeenCalledWith('carla');
    expect(store.loadOrders).toHaveBeenCalled();
  });

  it('debe mostrar y aplicar el rango personalizado', async () => {
    period.set('custom');
    const fixture = await setup();

    expect(query(fixture, 'company-sales-from')).not.toBeNull();
    expect(query(fixture, 'company-sales-to')).not.toBeNull();
    type(fixture, 'company-sales-from', '2026-10-01');
    type(fixture, 'company-sales-to', '2026-10-31');

    expect(store.setCustomFrom).toHaveBeenCalledWith('2026-10-01');
    expect(store.setCustomTo).toHaveBeenCalledWith('2026-10-31');
  });

  it('debe mostrar el vacío y abrir el asistente de Nueva Venta', async () => {
    filtered.set([]);
    const fixture = await setup();

    expect(query(fixture, 'company-sales-empty')?.textContent).toContain(
      'Sin ventas en este período',
    );

    query(fixture, 'company-sales-new')?.click();
    fixture.detectChanges();
    expect(query(fixture, 'company-new-sale-dialog')).not.toBeNull();
  });

  it('debe abrir la venta rápida desde el encabezado', async () => {
    const fixture = await setup();

    query(fixture, 'company-sales-quick')?.click();
    fixture.detectChanges();

    expect(query(fixture, 'company-quick-sale-dialog')).not.toBeNull();
  });

  it('debe registrar una venta desde el asistente y cerrar el modal', async () => {
    const fixture = await setup();
    const payload: CreateCompanySalePayload = {
      client: { mode: 'final', name: 'Consumidor final' },
      lines: [
        {
          id: 'line-1',
          kind: 'product',
          code: 'SKU-1',
          name: 'Café',
          quantity: 1,
          unitPrice: 150,
          subtotal: 150,
        },
      ],
      paymentMethod: 'efectivo',
      date: '2026-10-27',
      discountPercent: 0,
      notes: '',
    };

    query(fixture, 'company-sales-new')?.click();
    fixture.detectChanges();
    fixture.componentInstance.submitNewSale(payload);
    fixture.detectChanges();

    expect(store.createSale).toHaveBeenCalledWith(payload);
    expect(query(fixture, 'company-new-sale-dialog')).toBeNull();
  });

  it('debe mantener el modal abierto y mostrar el error si la venta falla', async () => {
    store.createSale.mockReturnValueOnce({ ok: false, message: 'No se pudo registrar.' });
    const fixture = await setup();

    query(fixture, 'company-sales-quick')?.click();
    fixture.detectChanges();
    fixture.componentInstance.submitQuickSale({
      client: { mode: 'final', name: 'Consumidor final' },
      lines: [],
      paymentMethod: 'efectivo',
      date: '2026-10-27',
      discountPercent: 0,
      notes: '',
    });
    fixture.detectChanges();

    expect(query(fixture, 'company-quick-sale-dialog')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se pudo registrar.');
  });

  it('debe paginar y mostrar el error del store', async () => {
    totalPages.set(2);
    page.set(1);
    error.set('No se pudieron cargar las ventas.');
    const fixture = await setup();

    expect(query(fixture, 'company-sales-error')?.textContent).toContain(
      'No se pudieron cargar las ventas.',
    );
    query(fixture, 'company-sales-next')?.click();
    fixture.detectChanges();
    expect(store.nextPage).toHaveBeenCalled();
    query(fixture, 'company-sales-prev')?.click();
    fixture.detectChanges();
    expect(store.previousPage).toHaveBeenCalled();
  });

  it('debe refrescar desde los botones Actualizar', async () => {
    const fixture = await setup();
    vi.clearAllMocks();

    query(fixture, 'company-sales-refresh')?.click();
    query(fixture, 'company-recurring-refresh')?.click();

    expect(store.loadOrders).toHaveBeenCalledTimes(2);
    expect(store.loadProducts).toHaveBeenCalledTimes(2);
    expect(store.loadStores).toHaveBeenCalledTimes(2);
    expect(store.loadSales).toHaveBeenCalledTimes(2);
  });
});
