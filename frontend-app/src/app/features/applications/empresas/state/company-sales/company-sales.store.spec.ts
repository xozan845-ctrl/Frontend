import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { OrderResponse } from '../../../cart/public-api';
import type { CatalogProduct } from '../../../products/public-api';
import { CatalogProductRepository } from '../../../products/repositories/catalog-product.repository';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../products/public-api';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { CompanySalesStore } from './company-sales.store';
import {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  type CompanyPortalRepository,
} from '../../repositories/company-portal.repository';
import { createCompanyOrdersSource } from '../../services/company-orders-source/company-orders-source.service';
import { clientsStorageKey } from '../../../../domains/clients/public-api';
import { companySalesStorageKey } from '../../constants/company-sales.constants';
import type { CompanySaleRecord, CreateCompanySalePayload } from '../../models/company-sale.model';

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function order(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 'o-1',
    orderNumber: 'ORD-1',
    status: 'pagada',
    total: 300,
    createdAt: isoDaysAgo(0),
    buyerId: 'buyer-1',
    storeId: 'store-1',
    items: [
      {
        ofertaId: 'of-1',
        sku: 'SKU-1',
        name: 'Café',
        quantity: 1,
        unitPrice: 300,
        storeId: 'store-1',
      },
    ],
    ...overrides,
  };
}

function product(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: 'p-1',
    companyId: 'empresa-1',
    sku: 'SKU-1',
    name: 'Café',
    description: '',
    category: 'Bebidas',
    basePrice: 150,
    stock: 10,
    status: 'disponible',
    createdAt: isoDaysAgo(30),
    ...overrides,
  };
}

function saleRecord(overrides: Partial<CompanySaleRecord> = {}): CompanySaleRecord {
  return {
    id: 'sale-1',
    number: 'V-000001',
    createdAt: isoDaysAgo(1),
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
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
    ],
    subtotal: 150,
    discount: 0,
    total: 150,
    profit: 0,
    notes: '',
    providerName: 'Tienda Norte',
    ...overrides,
  };
}

function payload(overrides: Partial<CreateCompanySalePayload> = {}): CreateCompanySalePayload {
  return {
    client: { mode: 'final', name: 'Consumidor final' },
    lines: [
      {
        id: 'line-1',
        kind: 'product',
        referenceId: 'p-1',
        code: 'SKU-1',
        name: 'Café',
        quantity: 2,
        unitPrice: 150,
        subtotal: 300,
      },
    ],
    paymentMethod: 'efectivo',
    date: new Date().toISOString(),
    discountPercent: 0,
    notes: '',
    ...overrides,
  };
}

const tenantId = signal<string | null>('empresa-1');
const authStore = {
  user: computed(() => ({
    id: 'u-1',
    email: 'owner@empresa.com',
    name: 'Karla',
    tenantId: tenantId(),
  })),
};

describe('CompanySalesStore', () => {
  let portalRepo: CompanyPortalRepository;
  let catalogRepo: CatalogProductRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    portalRepo = {
      orders: vi.fn(() => of<OrderResponse[]>([order()])),
      sales: vi.fn(() =>
        of({
          companyId: 'empresa-1',
          sales: [
            {
              orderId: 'o-1',
              sale: 300,
              commission: 30,
              companyAmount: 270,
              status: 'acreditada',
              date: isoDaysAgo(1),
            },
          ],
          pendingCommissions: 0,
        }),
      ),
      stores: vi.fn(() =>
        of([
          {
            id: 'store-1',
            companyId: 'empresa-1',
            ownerUserId: 'u-1',
            sellerId: '',
            name: 'Tienda Norte',
            description: '',
            participationPercentage: 10,
            createdAt: isoDaysAgo(100),
          },
        ]),
      ),
    };
    catalogRepo = {
      list: vi.fn(() => of({ items: [product()], total: 1, page: 1, limit: 20, pages: 1 })),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        CompanySalesStore,
        { provide: COMPANY_PORTAL_REPOSITORY, useValue: portalRepo },
        { provide: COMPANY_ORDERS_SOURCE, useValue: createCompanyOrdersSource(portalRepo) },
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: catalogRepo },
        { provide: NotificationService, useValue: notification },
        { provide: AuthStore, useValue: authStore },
      ],
    });
    return TestBed.inject(CompanySalesStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('empresa-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar órdenes, productos, tiendas y estado de cuenta', async () => {
    const store = setup();

    store.loadOrders();
    store.loadProducts();
    store.loadStores();
    store.loadSales();
    await vi.waitFor(() => expect(store.rows()).toHaveLength(1));

    expect(store.orders()).toHaveLength(1);
    expect(portalRepo.orders).toHaveBeenCalledWith({ limit: 100 });
    expect(catalogRepo.list).toHaveBeenCalledWith({ limit: 100, status: 'disponible' });
    expect(store.products()).toHaveLength(1);
    expect(store.stores()).toHaveLength(1);
    expect(store.salesAccount()?.sales).toHaveLength(1);
    expect(store.rows()[0]).toMatchObject({
      number: 'ORD-1',
      clientName: 'Cliente BUYER-1',
      providerName: 'Tienda Norte',
      profit: 270,
    });
    expect(store.providerName()).toBe('Tienda Norte');
    expect(store.kpis().monthSales).toBe(300);
  });

  it('debe cargar productos activos y calcular recurrentes con órdenes frecuentes', async () => {
    portalRepo = {
      orders: vi.fn(() =>
        of([
          order({ id: 'o-1', createdAt: isoDaysAgo(60) }),
          order({ id: 'o-2', createdAt: isoDaysAgo(30) }),
          order({ id: 'o-3', createdAt: isoDaysAgo(1) }),
        ]),
      ),
      sales: vi.fn(() => of({ companyId: 'empresa-1', sales: [], pendingCommissions: 0 })),
      stores: vi.fn(() => of([])),
    };
    catalogRepo = {
      list: vi.fn(() =>
        of({
          items: [product(), product({ id: 'p-2', status: 'agotado' })],
          total: 2,
          page: 1,
          limit: 20,
          pages: 1,
        }),
      ),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CompanySalesStore,
        { provide: COMPANY_PORTAL_REPOSITORY, useValue: portalRepo },
        { provide: COMPANY_ORDERS_SOURCE, useValue: createCompanyOrdersSource(portalRepo) },
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: catalogRepo },
        { provide: NotificationService, useValue: notification },
        { provide: AuthStore, useValue: authStore },
      ],
    });
    const store = TestBed.inject(CompanySalesStore);

    store.loadOrders();
    store.loadProducts();
    await vi.waitFor(() => expect(store.rows()).toHaveLength(3));

    expect(store.activeProducts()).toHaveLength(1);
    expect(store.recurringClients()).toHaveLength(1);
    expect(store.recurringClients()[0].name).toBe('Cliente BUYER-1');
  });

  it('debe registrar una venta local, persistirla y actualizar el folio', async () => {
    const store = setup();
    const result = store.createSale(payload());

    expect(result.ok).toBe(true);
    expect(store.localSales()).toHaveLength(1);
    expect(store.lastCreated()?.number).toBe('V-000001');
    expect(store.nextNumber()).toBe('V-000002');
    expect(notification.showSuccess).toHaveBeenCalledWith('Venta V-000001 registrada.');
    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(companySalesStorageKey('empresa-1')) ?? '[]'),
      ).toHaveLength(1),
    );
  });

  it('debe rechazar ventas inválidas sin tocar el historial', () => {
    const store = setup();
    const result = store.createSale(payload({ lines: [] }));

    expect(result).toEqual({
      ok: false,
      message: 'Revisa el cliente, las líneas y el total antes de registrar la venta.',
    });
    expect(store.localSales()).toHaveLength(0);
    expect(notification.showSuccess).not.toHaveBeenCalled();
  });

  it('debe respetar el límite de ventas locales', () => {
    const records = Array.from({ length: 500 }, (_, index) =>
      saleRecord({ id: `sale-${index}`, number: `V-${String(index + 1).padStart(6, '0')}` }),
    );
    localStorage.setItem(companySalesStorageKey('empresa-1'), JSON.stringify(records));
    const store = setup();

    const result = store.createSale(payload());

    expect(result.ok).toBe(false);
    expect(result.message).toContain('límite de ventas locales');
  });

  it('debe restaurar ventas y clientes locales aislados por tenant', () => {
    const client = {
      id: 'local-1',
      name: 'Pedro Local',
      phone: '8888',
      email: 'pedro@correo.com',
      company: 'Norte',
      source: 'manual' as const,
      createdAt: isoDaysAgo(10),
    };
    localStorage.setItem(companySalesStorageKey('empresa-1'), JSON.stringify([saleRecord()]));
    localStorage.setItem(clientsStorageKey('company', 'empresa-1'), JSON.stringify([client]));
    localStorage.setItem(
      companySalesStorageKey('empresa-2'),
      JSON.stringify([saleRecord({ id: 'other' })]),
    );

    const store = setup();

    expect(store.localSales()).toHaveLength(1);
    expect(store.localClients()).toHaveLength(1);
    expect(store.clients().some((item) => item.name === 'Pedro Local')).toBe(true);
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(companySalesStorageKey('empresa-1'), '{');
    localStorage.setItem(clientsStorageKey('company', 'empresa-1'), 'no-json');
    const store = setup();

    expect(store.localSales()).toEqual([]);
    expect(store.localClients()).toEqual([]);
  });

  it('debe notificar errores al cargar órdenes y productos', async () => {
    portalRepo = {
      orders: vi.fn(() => throwError(() => new Error('falló órdenes'))),
      sales: vi.fn(),
      stores: vi.fn(),
    };
    catalogRepo = {
      list: vi.fn(() => throwError(() => new Error('falló catálogo'))),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CompanySalesStore,
        { provide: COMPANY_PORTAL_REPOSITORY, useValue: portalRepo },
        { provide: COMPANY_ORDERS_SOURCE, useValue: createCompanyOrdersSource(portalRepo) },
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: catalogRepo },
        { provide: NotificationService, useValue: notification },
        { provide: AuthStore, useValue: authStore },
      ],
    });
    const store = TestBed.inject(CompanySalesStore);

    store.loadOrders();
    store.loadProducts();
    await vi.waitFor(() => expect(store.error()).toBe('falló catálogo'));

    expect(notification.showError).toHaveBeenCalledWith('falló órdenes');
    expect(notification.showError).toHaveBeenCalledWith('falló catálogo');
    expect(store.loading()).toBe(false);
    expect(store.productsLoading()).toBe(false);
  });

  it('debe usar el mensaje de ventas por defecto al fallar las órdenes', async () => {
    const store = setup();
    vi.mocked(portalRepo.orders).mockReturnValue(throwError(() => new Error('')));

    store.loadOrders();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar las ventas.'));

    expect(notification.showError).toHaveBeenCalledWith('No se pudieron cargar las ventas.');
  });

  it('debe tolerar fallos de tiendas y estado de cuenta', async () => {
    const catalog = { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() };
    portalRepo = {
      orders: vi.fn(() => of([])),
      sales: vi.fn(() => throwError(() => new Error('sin estado'))),
      stores: vi.fn(() => throwError(() => new Error('sin tiendas'))),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CompanySalesStore,
        { provide: COMPANY_PORTAL_REPOSITORY, useValue: portalRepo },
        { provide: COMPANY_ORDERS_SOURCE, useValue: createCompanyOrdersSource(portalRepo) },
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: catalog },
        { provide: NotificationService, useValue: notification },
        { provide: AuthStore, useValue: authStore },
      ],
    });
    const store = TestBed.inject(CompanySalesStore);

    store.loadStores();
    store.loadSales();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.stores()).toEqual([]);
    expect(store.salesAccount()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('debe filtrar, paginar y limpiar filtros', () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      saleRecord({
        id: `sale-${index}`,
        number: `V-${String(index + 1).padStart(6, '0')}`,
        createdAt: isoDaysAgo(index),
        clientName: index === 0 ? 'Carla López' : `Cliente ${index}`,
        paymentMethod: index === 1 ? 'separado' : 'efectivo',
      }),
    );
    localStorage.setItem(companySalesStorageKey('empresa-1'), JSON.stringify(records));
    const store = setup();

    expect(store.pagedRows()).toHaveLength(10);
    expect(store.pageCount()).toBe(2);
    expect(store.isFirstPage()).toBe(true);
    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedRows()).toHaveLength(2);
    expect(store.isLastPage()).toBe(true);
    store.previousPage();
    expect(store.currentPage()).toBe(1);

    store.setSearch('carla');
    expect(store.filteredRows()).toHaveLength(1);
    store.setPayment('credit');
    expect(store.filteredRows()).toHaveLength(0);
    store.setPayment('all');
    store.setPeriod('today');
    expect(store.filteredRows()).toHaveLength(1);
    store.setCustomFrom('2026-01-01');
    store.setCustomTo('2026-12-31');
    store.setPeriod('custom');
    expect(store.hasFilters()).toBe(true);
    store.clearFilters();
    expect(store.period()).toBe('month');
    expect(store.payment()).toBe('all');
    expect(store.search()).toBe('');
    expect(store.currentPage()).toBe(1);
    expect(store.filteredRows().length).toBeGreaterThan(0);
  });

  it('debe reiniciar el estado y conservar el folio local', () => {
    const store = setup();
    store.createSale(payload());
    store.setPayment('credit');

    store.reset();

    expect(store.localSales()).toHaveLength(1);
    expect(store.payment()).toBe('all');
    expect(store.search()).toBe('');
    expect(store.lastCreated()).toBeNull();
  });
});
