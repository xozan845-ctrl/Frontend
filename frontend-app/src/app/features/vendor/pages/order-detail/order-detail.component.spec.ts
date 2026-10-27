import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import OrderDetailComponent from './order-detail.component';
import { createVendorOrdersSource } from '../../services/vendor-orders-source/vendor-orders-source.service';
import {
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  VendorOrderRepository,
} from '../../repositories/vendor-order.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../core/services/seo/seo.service';
import { VendorOrdersStore } from '../../state/vendor-orders/vendor-orders.store';
import { OrderStatus, VendorOrder } from '../../models/vendor-order.model';

const pendingOrder: VendorOrder = {
  id: 'PED-000126',
  clientId: 'vc-1',
  clientName: 'Carla López',
  createdAt: '2026-10-15T10:32:00Z',
  status: 'pendiente',
  total: 621,
  lines: [
    { productId: 'vp-1', name: 'Shampoo Keratina', sku: 'KPBM-001', unitPrice: 180, quantity: 2 },
    {
      productId: 'vp-2',
      name: 'Mascarilla Reparadora',
      sku: 'SP-002',
      unitPrice: 220,
      quantity: 1,
    },
  ],
  notes: 'Entregar por la tarde',
};

interface SetupOptions {
  order?: VendorOrder;
  fail?: boolean;
}

describe('OrderDetailComponent', () => {
  let orderRepo: VendorOrderRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async (options: SetupOptions = {}) => {
    const base = options.order ?? pendingOrder;
    orderRepo = {
      listOrders: vi.fn(() => of([])),
      getOrder: vi.fn(() =>
        options.fail ? throwError(() => new Error('sin conexión')) : of(base),
      ),
      createOrder: vi.fn(() => of(base)),
      updateStatus: vi.fn((_id: string, status: OrderStatus) => of({ ...base, status })),
    };
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideRouter([]),
        VendorOrdersStore,
        { provide: VENDOR_ORDER_REPOSITORY, useValue: orderRepo },
        { provide: VENDOR_ORDERS_SOURCE, useValue: createVendorOrdersSource(orderRepo) },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.componentRef.setInput('id', 'PED-000126');
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar el pedido con líneas, resumen y SEO del id', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="detail-line"]')).toHaveLength(2),
    );

    expect(orderRepo.getOrder).toHaveBeenCalledWith('PED-000126');
    expect(host.querySelector('[data-testid="detail-line"]')?.textContent).toContain(
      'Shampoo Keratina',
    );
    expect(host.querySelector('[data-testid="detail-line"]')?.textContent).toContain('C$360.00');
    expect(host.querySelector('[data-testid="detail-total"]')?.textContent).toContain('C$621.00');
    expect(host.textContent).toContain('Carla López');
    expect(host.textContent).toContain('Entregar por la tarde');
    expect(seo.setPage).toHaveBeenCalledWith(
      'Pedido PED-000126 — Panel del vendedor',
      expect.any(String),
    );
  });

  it('debe mostrar el error con reintento', async () => {
    const fixture = await setup({ fail: true });
    const host = fixture.nativeElement as HTMLElement;

    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="order-detail-error"]')).not.toBeNull(),
    );
    expect(host.textContent).toContain('sin conexión');

    vi.mocked(orderRepo.getOrder).mockReturnValue(of(pendingOrder));
    (host.querySelector('[data-testid="retry-detail"]') as HTMLButtonElement).click();

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="detail-line"]')).toHaveLength(2),
    );
  });

  it('debe pedir confirmación accesible antes de cambiar el estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="detail-line"]')).toHaveLength(2),
    );

    // En `pendiente` solo se ofrece avanzar a en proceso o cancelar.
    expect(host.querySelector('[data-testid="change-status-completado"]')).toBeNull();

    (host.querySelector('[data-testid="change-status-en_proceso"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const dialog = host.querySelector('[data-testid="confirm-dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.textContent).toContain(
      '¿Seguro que quieres pasar el pedido PED-000126 a en proceso?',
    );

    (host.querySelector('[data-testid="confirm-accept"]') as HTMLButtonElement).click();

    await vi.waitFor(() =>
      expect(orderRepo.updateStatus).toHaveBeenCalledWith('PED-000126', 'en_proceso'),
    );
    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="order-status-badge"]')?.textContent).toContain(
        'En proceso',
      ),
    );
    expect(notification.showSuccess).toHaveBeenCalledWith('Pedido PED-000126 actualizado.');

    fixture.detectChanges();
    expect(host.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
    expect(host.querySelector('[data-testid="change-status-completado"]')).not.toBeNull();
  });

  it('debe cancelar con confirmación de peligro y mostrar el estado final', async () => {
    const fixture = await setup({ order: { ...pendingOrder, status: 'en_proceso' } });
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="detail-line"]')).toHaveLength(2),
    );

    (host.querySelector('[data-testid="change-status-cancelado"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const accept = host.querySelector('[data-testid="confirm-accept"]') as HTMLButtonElement;
    expect(accept.className).toContain('btn-danger');
    accept.click();

    await vi.waitFor(() =>
      expect(orderRepo.updateStatus).toHaveBeenCalledWith('PED-000126', 'cancelado'),
    );
    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="detail-cancelled"]')).not.toBeNull(),
    );
    expect(host.querySelector('[data-testid="detail-final-state"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="change-status-completado"]')).toBeNull();
  });

  it('debe permitir cerrar la confirmación sin cambiar nada', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="detail-line"]')).toHaveLength(2),
    );

    (host.querySelector('[data-testid="change-status-en_proceso"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (host.querySelector('[data-testid="confirm-cancel"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
    expect(orderRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('debe limpiar el detalle y el SEO al salir', async () => {
    const fixture = await setup();
    const store = TestBed.inject(VendorOrdersStore);
    await vi.waitFor(() => expect(store.selectedOrder()).not.toBeNull());

    fixture.destroy();

    expect(store.selectedOrder()).toBeNull();
    expect(seo.reset).toHaveBeenCalled();
  });
});
