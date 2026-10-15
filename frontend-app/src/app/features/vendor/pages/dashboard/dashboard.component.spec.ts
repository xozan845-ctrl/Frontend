import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of, throwError } from 'rxjs';
import DashboardComponent from './dashboard.component';
import {
  VENDOR_ORDER_REPOSITORY,
  VendorOrderRepository,
} from '../../repositories/vendor-order.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';
import { VendorOrder } from '../../models/vendor-order.model';
import { VendorOrdersStore } from '../../state/vendor-orders.store';

const now = new Date();
const atDay = (daysAgo: number, hours: number): string =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours).toISOString();

const order = (
  id: string,
  status: VendorOrder['status'],
  total: number,
  createdAt: string,
): VendorOrder => ({
  id,
  clientId: null,
  clientName: 'Cliente ocasional',
  createdAt,
  status,
  total,
  lines: [],
  notes: '',
});

const todayOrder = order('PED-1', 'en_proceso', 1000, atDay(0, 9));
const cancelledToday = order('PED-2', 'cancelado', 500, atDay(0, 10));
const pendingYesterday = order('PED-3', 'pendiente', 700, atDay(1, 9));

describe('DashboardComponent (inicio)', () => {
  let repo: VendorOrderRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async (listOrders: () => Observable<VendorOrder[]> = () => of([todayOrder])) => {
    repo = {
      listOrders: vi.fn(listOrders),
      getOrder: vi.fn(() => of(todayOrder)),
      createOrder: vi.fn(() => of(todayOrder)),
      updateStatus: vi.fn(() => of(todayOrder)),
    };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        VendorOrdersStore,
        { provide: VENDOR_ORDER_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe pintar los KPIs de hoy, el vendido sin cancelados y el SEO', async () => {
    const { fixture, host } = await setup(() => of([todayOrder, cancelledToday, pendingYesterday]));
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]').length).toBe(3),
    );
    fixture.detectChanges();

    expect(seo.setPage).toHaveBeenCalledWith('Inicio — Panel del vendedor', expect.any(String));
    expect(host.querySelector('[data-testid="kpi-sold"]')?.textContent).toContain('C$');
    expect(host.querySelector('[data-testid="kpi-orders-today"]')?.textContent).toContain('2');
    expect(host.querySelector('[data-testid="kpi-pending"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-testid="kpi-in-progress"]')?.textContent).toContain('1');
  });

  it('debe ofrecer los accesos rápidos con sus enlaces', async () => {
    const { host } = await setup();

    expect(
      (host.querySelector('[data-testid="quick-new-order"]') as HTMLAnchorElement).getAttribute(
        'href',
      ),
    ).toBe('/vendedor/ventas/nuevo');
    expect(
      (host.querySelector('[data-testid="quick-orders"]') as HTMLAnchorElement).getAttribute(
        'href',
      ),
    ).toBe('/vendedor/pedidos');
    expect(
      (host.querySelector('[data-testid="quick-clients"]') as HTMLAnchorElement).getAttribute(
        'href',
      ),
    ).toBe('/vendedor/clientes');
  });

  it('debe mostrar esqueletos y bloquear la actualización mientras carga', async () => {
    const { host } = await setup(() => NEVER);

    expect(host.querySelectorAll('app-skeleton-loader').length).toBeGreaterThan(0);
    expect(
      (host.querySelector('[data-testid="refresh-dashboard"]') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('debe mostrar el error de la carga y reintentar', async () => {
    const { fixture, host } = await setup(() => throwError(() => new Error('sin red')));
    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="recent-orders-error"]')).not.toBeNull(),
    );
    expect(host.textContent).toContain('sin red');
    expect(notification.showError).toHaveBeenCalledWith('sin red');

    vi.mocked(repo.listOrders).mockReturnValue(of([todayOrder]));
    (host.querySelector('[data-testid="retry-orders"]') as HTMLButtonElement).click();

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="recent-order-row"]').length).toBe(1),
    );
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="view-all-orders"]')).not.toBeNull();
  });

  it('debe limpiar el SEO al salir', async () => {
    const { fixture } = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalledTimes(1);
  });
});
