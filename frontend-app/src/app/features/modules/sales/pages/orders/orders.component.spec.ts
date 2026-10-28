import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import OrdersComponent from './orders.component';
import {
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  VendorOrdersStore,
  createVendorOrdersSource,
  type OrderStatus,
  type VendorOrder,
  type VendorOrderRepository,
} from '../../../../applications/vendor/public-api';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../../core/services/seo/seo.service';

const makeOrder = (id: string, status: OrderStatus): VendorOrder => ({
  id,
  clientId: 'vc-1',
  clientName: 'Carla López',
  createdAt: '2026-10-15T10:32:00Z',
  status,
  total: 621,
  lines: [],
  notes: '',
});

const mixedOrders: VendorOrder[] = [
  makeOrder('PED-000127', 'pendiente'),
  makeOrder('PED-000126', 'en_proceso'),
  makeOrder('PED-000125', 'en_proceso'),
  makeOrder('PED-000124', 'completado'),
  makeOrder('PED-000123', 'cancelado'),
];

describe('OrdersComponent (lista de pedidos)', () => {
  let orderRepo: VendorOrderRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async (orders: VendorOrder[] = mixedOrders) => {
    orderRepo = {
      listOrders: vi.fn(() => of(orders)),
      getOrder: vi.fn(() => of(orders[0])),
      createOrder: vi.fn(() => of(orders[0])),
      updateStatus: vi.fn(() => of(orders[0])),
    };
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        provideRouter([]),
        VendorOrdersStore,
        { provide: VENDOR_ORDER_REPOSITORY, useValue: orderRepo },
        { provide: VENDOR_ORDERS_SOURCE, useValue: createVendorOrdersSource(orderRepo) },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrdersComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar la lista y fijar el SEO', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(seo.setPage).toHaveBeenCalledWith('Pedidos — Panel del vendedor', expect.any(String));
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(5),
    );
    expect(host.querySelector('[data-testid="view-all-orders"]')).toBeNull();
  });

  it('debe filtrar por estado con los chips y contar cada estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(5),
    );

    expect(host.querySelector('[data-testid="count-all"]')?.textContent).toContain('(5)');
    expect(host.querySelector('[data-testid="count-en_proceso"]')?.textContent).toContain('(2)');
    expect(host.querySelector('[data-testid="count-pendiente"]')?.textContent).toContain('(1)');

    (host.querySelector('[data-testid="filter-en_proceso"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const filtered = host.querySelectorAll('[data-testid="recent-order-row"]');
    expect(filtered).toHaveLength(2);
    expect(filtered[0].textContent).toContain('PED-000126');
    expect(filtered[1].textContent).toContain('PED-000125');

    (host.querySelector('[data-testid="filter-all"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(5);
  });

  it('debe mostrar el vacío del filtro cuando ningún pedido coincide', async () => {
    const fixture = await setup([makeOrder('PED-000127', 'pendiente')]);
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(1),
    );

    (host.querySelector('[data-testid="filter-cancelado"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Sin pedidos con este estado');
  });

  it('debe actualizar la lista con el botón Actualizar', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(5),
    );

    vi.mocked(orderRepo.listOrders).mockReturnValue(of([makeOrder('PED-000200', 'pendiente')]));
    (host.querySelector('[data-testid="refresh-orders"]') as HTMLButtonElement).click();

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(1),
    );
    expect(host.querySelector('[data-testid="recent-order-row"]')?.textContent).toContain(
      'PED-000200',
    );
    expect(orderRepo.listOrders).toHaveBeenCalledTimes(2);
  });

  it('debe resetear el SEO al salir de la página', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});
