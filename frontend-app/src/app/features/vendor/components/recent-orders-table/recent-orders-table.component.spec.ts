import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecentOrdersTableComponent, formatOrderDate } from './recent-orders-table.component';
import { OrderStatus, VendorOrder } from '../../models/vendor-order.model';

const order = (id: string, status: OrderStatus = 'pendiente'): VendorOrder => ({
  id,
  clientId: 'vc-1',
  clientName: 'Carla López',
  createdAt: '2026-10-15T10:32:00Z',
  status,
  total: 1339.75,
  lines: [],
  notes: '',
});

interface SetupOptions {
  orders?: VendorOrder[];
  loading?: boolean;
  error?: string | null;
}

describe('RecentOrdersTableComponent', () => {
  const setup = async (options: SetupOptions = {}) => {
    await TestBed.configureTestingModule({
      imports: [RecentOrdersTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(RecentOrdersTableComponent);
    fixture.componentRef.setInput(
      'orders',
      options.orders ?? [order('PED-000125', 'en_proceso'), order('PED-000124')],
    );
    fixture.componentRef.setInput('loading', options.loading ?? false);
    fixture.componentRef.setInput('error', options.error ?? null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar pedidos con total, estado, fecha y enlace a todos', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const rows = host.querySelectorAll('[data-testid="recent-order-row"]');

    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('PED-000125');
    expect(rows[0].textContent).toContain('Carla López');
    expect(rows[0].textContent).toContain('C$1,339.75');
    expect(rows[0].textContent).toContain('En proceso');
    expect(rows[0].textContent).toContain('oct');
    expect(host.querySelector('[data-testid="order-date"]')?.textContent?.trim()).not.toBe('—');
    expect(host.querySelector('[data-testid="view-all-orders"]')?.getAttribute('href')).toBe(
      '/vendedor/pedidos',
    );
  });

  it('debe mostrar "—" cuando la fecha del pedido no es válida', () => {
    expect(formatOrderDate('')).toBe('—');
    expect(formatOrderDate('no-es-fecha')).toBe('—');
  });

  it('debe mostrar skeletons mientras carga', async () => {
    const fixture = await setup({ loading: true });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('app-skeleton-loader').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(0);
  });

  it('debe mostrar el error con acción de reintento', async () => {
    const fixture = await setup({ error: 'sin conexión' });
    const host = fixture.nativeElement as HTMLElement;
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);

    expect(host.querySelector('[data-testid="recent-orders-error"]')?.textContent).toContain(
      'sin conexión',
    );

    (host.querySelector('[data-testid="retry-orders"]') as HTMLButtonElement).click();
    expect(retries).toBe(1);
  });

  it('debe mostrar el vacío sin pedidos', async () => {
    const fixture = await setup({ orders: [] });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="recent-orders-empty"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="view-all-orders"]')).not.toBeNull();
  });
});
