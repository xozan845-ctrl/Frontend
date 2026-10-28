import { TestBed } from '@angular/core/testing';
import { Courier } from '../../models/logistica.model';
import { CouriersListComponent } from './couriers-list.component';

const couriers: readonly Courier[] = [
  {
    id: 'carlos-mendoza',
    name: 'Carlos Mendoza',
    initials: 'CM',
    routeLabel: 'Ruta 1',
    zone: 'Zona Centro',
    delivered: 4,
    total: 8,
    status: 'en_ruta',
  },
  {
    id: 'diego-ramos',
    name: 'Diego Ramos',
    initials: 'DR',
    routeLabel: 'Ruta 3',
    zone: 'Zona Este',
    delivered: 3,
    total: 7,
    status: 'retraso',
  },
];

describe('CouriersListComponent', () => {
  const setup = async (data: readonly Courier[] = couriers, loading = false) => {
    await TestBed.configureTestingModule({ imports: [CouriersListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CouriersListComponent);
    fixture.componentRef.setInput('couriers', data);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar cada repartidor con su ruta, zona y progreso', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const rows = host.querySelectorAll('[data-testid="courier-row"]');

    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Carlos Mendoza');
    expect(rows[0].textContent).toContain('Ruta 1 · Zona Centro');
    expect(rows[0].textContent).toContain('4/8 entregas');
    expect(rows[0].querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('50');
  });

  it('debe mostrar el chip de estado del repartidor', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const rows = host.querySelectorAll('[data-testid="courier-row"]');

    expect(rows[0].textContent).toContain('En ruta');
    expect(rows[1].textContent).toContain('Retraso');
  });

  it('debe mostrar esqueletos mientras carga y ninguna fila', async () => {
    const fixture = await setup(couriers, true);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid="courier-row"]')).toHaveLength(0);
    expect(host.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
