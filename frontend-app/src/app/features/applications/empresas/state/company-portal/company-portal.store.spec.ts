import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompanyPortalStore } from './company-portal.store';
import {
  COMPANY_PORTAL_REPOSITORY,
  CompanyPortalRepository,
} from '../../repositories/company-portal.repository';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import type { OrderResponse } from '../../../cart/public-api';
import type { CompanySalesAccount } from '../../models/company-sales.model';
import type { CompanyStore } from '../../models/company-store.model';

const order: OrderResponse = {
  id: 'o-1',
  orderNumber: 'ORD-O-1',
  status: 'pagada',
  total: 2300,
  createdAt: '2026-10-22T15:00:00.000Z',
  storeId: 'tienda-1',
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

const sales: CompanySalesAccount = {
  companyId: 'empresa-1',
  sales: [
    {
      orderId: 'o-1',
      sale: 2300,
      commission: 276,
      companyAmount: 2024,
      status: 'acreditada',
      date: '2026-10-22T15:00:00.000Z',
    },
  ],
  pendingCommissions: 138,
};

const store: CompanyStore = {
  id: 'tienda-1',
  companyId: 'empresa-1',
  ownerUserId: 'user-1',
  sellerId: 'vendedor-1',
  name: 'Tienda Centro',
  description: 'Sucursal central',
  participationPercentage: 100,
  createdAt: '2026-10-21T10:00:00.000Z',
};

describe('CompanyPortalStore', () => {
  let repo: CompanyPortalRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      orders: vi.fn(() => of<OrderResponse[]>([order])),
      sales: vi.fn(() => of<CompanySalesAccount>(sales)),
      stores: vi.fn(() => of<CompanyStore[]>([store])),
    };
    TestBed.configureTestingModule({
      providers: [
        CompanyPortalStore,
        { provide: COMPANY_PORTAL_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyPortalStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar órdenes con filtros y seleccionar', async () => {
    const storeSignal = setup();
    storeSignal.setStoreFilter('tienda-1');
    storeSignal.setStatusFilter('pagada');

    storeSignal.loadOrders();

    await vi.waitFor(() => expect(storeSignal.orders()).toHaveLength(1));
    expect(repo.orders).toHaveBeenCalledWith({
      storeId: 'tienda-1',
      status: 'pagada',
      limit: 100,
    });

    storeSignal.selectOrder(order);
    expect(storeSignal.selectedOrder()?.id).toBe('o-1');
    storeSignal.closeOrder();
    expect(storeSignal.selectedOrder()).toBeNull();
  });

  it('debe reflejar una lista de órdenes vacía', async () => {
    const storeSignal = setup();
    vi.mocked(repo.orders).mockReturnValue(of<OrderResponse[]>([]));

    storeSignal.loadOrders();
    await vi.waitFor(() => expect(storeSignal.ordersLoading()).toBe(false));

    expect(storeSignal.hasOrders()).toBe(false);
  });

  it('debe cargar ventas y calcular el resumen', async () => {
    const storeSignal = setup();

    storeSignal.loadSales();
    await vi.waitFor(() => expect(storeSignal.sales()).toEqual(sales));

    expect(storeSignal.salesSummary()).toEqual({
      totalSales: 2300,
      totalCommission: 276,
      totalCompanyAmount: 2024,
      salesCount: 1,
    });
    expect(storeSignal.pendingCommissions()).toBe(138);
  });

  it('debe cargar tiendas', async () => {
    const storeSignal = setup();

    storeSignal.loadStores();
    await vi.waitFor(() => expect(storeSignal.stores()).toHaveLength(1));
    expect(storeSignal.storeCount()).toBe(1);
  });

  it('debe registrar errores de órdenes, ventas y tiendas', async () => {
    const storeSignal = setup();
    vi.mocked(repo.orders).mockReturnValue(throwError(() => new Error('')));
    storeSignal.loadOrders();
    await vi.waitFor(() => expect(storeSignal.error()).toBe('No se pudieron cargar las ventas.'));

    vi.mocked(repo.sales).mockReturnValue(throwError(() => new Error('')));
    storeSignal.loadSales();
    await vi.waitFor(() =>
      expect(storeSignal.error()).toBe('No se pudo cargar el estado de cuenta.'),
    );

    vi.mocked(repo.stores).mockReturnValue(throwError(() => new Error('')));
    storeSignal.loadStores();
    await vi.waitFor(() => expect(storeSignal.error()).toBe('No se pudieron cargar las tiendas.'));
  });

  it('debe limpiar y reiniciar', async () => {
    const storeSignal = setup();
    storeSignal.loadSales();
    await vi.waitFor(() => expect(storeSignal.sales()).not.toBeNull());

    storeSignal.clearError();
    expect(storeSignal.error()).toBeNull();

    storeSignal.reset();
    expect(storeSignal.sales()).toBeNull();
    expect(storeSignal.orders()).toEqual([]);
  });
});
