import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanyOrdersComponent from './company-orders.component';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { OrderResponse } from '../../../cart/public-api';
import type { CompanySalesSummary } from '../../models/company-sales.model';
import type { CompanyStore } from '../../models/company-store.model';

const order: OrderResponse = {
  id: 'o-1',
  orderNumber: 'ORD-O-1',
  status: 'pagada',
  total: 2300,
  createdAt: '2026-10-22T15:00:00.000Z',
  storeId: 'tienda-1',
  commission: 276,
  buyerId: 'comprador-1',
  items: [
    {
      ofertaId: 'of-1',
      sku: 'SKU-1',
      name: 'Teclado',
      quantity: 2,
      unitPrice: 1150,
      storeId: 'tienda-1',
    },
  ],
};

const summary: CompanySalesSummary = {
  totalSales: 2300,
  totalCommission: 276,
  totalCompanyAmount: 2024,
  salesCount: 1,
};

const store: CompanyStore = {
  id: 'tienda-1',
  companyId: 'empresa-1',
  ownerUserId: 'user-1',
  sellerId: 'vendedor-1',
  name: 'Tienda Centro',
  description: '',
  participationPercentage: 100,
  createdAt: '2026-10-21T10:00:00.000Z',
};

describe('CompanyOrdersComponent', () => {
  const orders = signal<OrderResponse[]>([]);
  const stores = signal<CompanyStore[]>([]);
  const selectedOrderId = signal<string | null>(null);
  const storeFilter = signal<string | null>(null);
  const statusFilter = signal<string | null>(null);
  const ordersLoading = signal(false);
  const salesLoading = signal(false);
  const storesLoading = signal(false);
  const error = signal<string | null>(null);
  const portal = {
    orders: orders.asReadonly(),
    stores: stores.asReadonly(),
    ordersLoading: ordersLoading.asReadonly(),
    salesLoading: salesLoading.asReadonly(),
    storesLoading: storesLoading.asReadonly(),
    error: error.asReadonly(),
    storeFilter: storeFilter.asReadonly(),
    statusFilter: statusFilter.asReadonly(),
    selectedOrder: computed(
      () => orders().find((item) => String(item.id) === selectedOrderId()) ?? null,
    ),
    salesSummary: computed(() => summary),
    pendingCommissions: computed(() => 138),
    storeCount: computed(() => stores().length),
    hasOrders: computed(() => orders().length > 0),
    loadOrders: vi.fn(),
    loadSales: vi.fn(),
    loadStores: vi.fn(),
    setStoreFilter: vi.fn((value: string | null) => storeFilter.set(value)),
    setStatusFilter: vi.fn((value: string | null) => statusFilter.set(value)),
    selectOrder: vi.fn((value: OrderResponse) => selectedOrderId.set(String(value.id))),
    closeOrder: vi.fn(() => selectedOrderId.set(null)),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyOrdersComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyPortalStore, useValue: portal },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyOrdersComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orders.set([]);
    stores.set([]);
    selectedOrderId.set(null);
    storeFilter.set(null);
    statusFilter.set(null);
    ordersLoading.set(false);
    salesLoading.set(false);
    storesLoading.set(false);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar órdenes, ventas y tiendas', async () => {
    await setup();

    expect(portal.loadOrders).toHaveBeenCalled();
    expect(portal.loadSales).toHaveBeenCalled();
    expect(portal.loadStores).toHaveBeenCalled();
  });

  it('debe mostrar resumen, órdenes y detalle', async () => {
    orders.set([order]);
    stores.set([store]);
    selectedOrderId.set('o-1');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="company-sales-total"]').textContent,
    ).toContain('C$2,300.00');
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="company-order-row"]'),
    ).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-order-detail"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Teclado');
  });

  it('debe filtrar por tienda y estado', async () => {
    orders.set([order]);
    stores.set([store]);
    const fixture = await setup();

    const storeSelect = fixture.nativeElement.querySelector(
      '[data-testid="company-orders-store-filter"]',
    ) as HTMLSelectElement;
    storeSelect.value = 'tienda-1';
    storeSelect.dispatchEvent(new Event('change'));
    expect(portal.setStoreFilter).toHaveBeenCalledWith('tienda-1');
    expect(portal.loadOrders).toHaveBeenCalled();

    const statusSelect = fixture.nativeElement.querySelector(
      '[data-testid="company-orders-status-filter"]',
    ) as HTMLSelectElement;
    statusSelect.value = 'pagada';
    statusSelect.dispatchEvent(new Event('change'));
    expect(portal.setStatusFilter).toHaveBeenCalledWith('pagada');
  });

  it('debe seleccionar y cerrar una orden', async () => {
    orders.set([order]);
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="company-order-select-o-1"]')
      .dispatchEvent(new Event('click'));
    expect(portal.selectOrder).toHaveBeenCalledWith(order);
  });

  it('debe mostrar carga, vacío y error', async () => {
    ordersLoading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    ordersLoading.set(false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-orders-empty"]'),
    ).not.toBeNull();

    error.set('No se pudieron cargar las ventas.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-orders-error"]').textContent,
    ).toContain('No se pudieron cargar las ventas.');
  });
});
