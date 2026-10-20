import { TestBed } from '@angular/core/testing';
import { RouteOrder } from '../../models/logistica.model';
import { OrdersTableComponent } from './orders-table.component';

const orders: readonly RouteOrder[] = [
  {
    id: 'P-1001',
    client: 'María López',
    address: 'Col. Centroamérica, Managua',
    zone: 'Centro',
    routeLabel: 'Ruta 1',
    tone: 'blue',
    status: 'en_ruta',
    eta: '10:30 a.m.',
  },
  {
    id: 'P-1005',
    client: 'Ana Torres',
    address: 'Las Colinas',
    zone: 'Sur',
    routeLabel: 'Ruta 4',
    tone: 'red',
    status: 'incidencia',
    eta: '12:20 p.m.',
  },
];

describe('OrdersTableComponent', () => {
  const setup = async (data: readonly RouteOrder[] = orders, loading = false) => {
    await TestBed.configureTestingModule({ imports: [OrdersTableComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrdersTableComponent);
    fixture.componentRef.setInput('orders', data);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar los pedidos con ruta, estado y hora estimada', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const rows = host.querySelectorAll('[data-testid="order-row"]');

    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('P-1001');
    expect(rows[0].textContent).toContain('María López');
    expect(rows[0].textContent).toContain('Ruta 1');
    expect(rows[0].textContent).toContain('En ruta');
    expect(rows[0].textContent).toContain('10:30 a.m.');
    expect(rows[1].textContent).toContain('Incidencias');
  });

  it('debe etiquetar el botón de ubicación con el pedido (R-AC-1)', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const locate = host.querySelector('[aria-label="Ubicar el pedido P-1001 en el mapa"]');

    expect(locate).not.toBeNull();
  });

  it('debe mostrar el vacío cuando la zona no tiene pedidos', async () => {
    const fixture = await setup([]);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="orders-empty"]')?.textContent).toContain(
      'No hay pedidos en ruta para esta zona.',
    );
  });

  it('debe mostrar esqueletos mientras carga y ninguna fila', async () => {
    const fixture = await setup(orders, true);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid="order-row"]')).toHaveLength(0);
    expect(host.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
