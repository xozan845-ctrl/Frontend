import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import RutasComponent from './rutas.component';
import { RutasStore } from '../../state/rutas/rutas.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import type { Parada, Ruta } from '../../models/ruta.model';

const stop: Parada = {
  id: 'parada-1',
  routeId: 'ruta-1',
  order: 1,
  name: 'Farmacia Central',
  address: 'Calle 1 #100',
  lat: null,
  lng: null,
  completed: false,
  type: 'cliente',
  phone: '',
  references: '',
  schedule: '',
  notes: '',
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-22T10:00:00.000Z',
};

const route: Ruta = {
  id: 'ruta-1',
  name: 'Ruta Centro',
  description: 'Entregas del casco urbano',
  status: 'pendiente',
  assignedPersonalIds: ['personal-1'],
  assignedVehicleId: 'vehiculo-1',
  startDate: '2026-10-24T08:00:00.000Z',
  endDate: '',
  stops: [stop],
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-22T10:00:00.000Z',
};

describe('RutasComponent', () => {
  const routes = signal<Ruta[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const selectedRouteId = signal<string | null>(null);
  const savingRouteId = signal<string | null>(null);
  const savingStopId = signal<string | null>(null);
  const statusFilter = signal('');
  const selectedRoute = computed(
    () => routes().find((item) => item.id === selectedRouteId()) ?? null,
  );
  const store = {
    routes: routes.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    selectedRouteId: selectedRouteId.asReadonly(),
    statusFilter: statusFilter.asReadonly(),
    filteredRoutes: computed(() => {
      const status = statusFilter();
      return status ? routes().filter((item) => item.status === status) : routes();
    }),
    savingRouteId: savingRouteId.asReadonly(),
    savingStopId: savingStopId.asReadonly(),
    selectedRoute,
    routeCount: computed(() => routes().length),
    totalStops: computed(() => routes().reduce((sum, item) => sum + item.stops.length, 0)),
    completedStops: computed(() =>
      routes().reduce((sum, item) => sum + item.stops.filter((s) => s.completed).length, 0),
    ),
    load: vi.fn(),
    selectRoute: vi.fn((id: string | null) => selectedRouteId.set(id)),
    setStatusFilter: vi.fn((status: string) => statusFilter.set(status)),
    updateStatus: vi.fn(),
    toggleStop: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [RutasComponent],
      providers: [
        { provide: RutasStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RutasComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    routes.set([]);
    loading.set(false);
    error.set(null);
    selectedRouteId.set(null);
    statusFilter.set('');
    savingRouteId.set(null);
    savingStopId.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar las rutas al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe listar rutas y mostrar el detalle seleccionado', async () => {
    routes.set([route]);
    selectedRouteId.set('ruta-1');
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="ruta-row"]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('[data-testid="ruta-detail"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[data-testid="parada-row"]')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Ruta Centro');
    expect(fixture.nativeElement.textContent).toContain('Farmacia Central');
  });

  it('debe filtrar rutas y cambiar el estado', async () => {
    routes.set([route]);
    selectedRouteId.set('ruta-1');
    const fixture = await setup();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="rutas-status-filter"]',
    ) as HTMLSelectElement;
    select.value = 'en_curso';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid="ruta-row"]')).toHaveLength(0);

    const target = fixture.nativeElement.querySelector(
      '[data-testid="ruta-target-status"]',
    ) as HTMLSelectElement;
    target.value = 'en_curso';
    target.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('[data-testid="ruta-save-status"]')
      .dispatchEvent(new Event('click'));

    expect(store.updateStatus).toHaveBeenCalledWith({ routeId: 'ruta-1', status: 'en_curso' });
  });

  it('debe completar una parada desde el detalle', async () => {
    routes.set([route]);
    selectedRouteId.set('ruta-1');
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="parada-toggle-parada-1"]')
      .dispatchEvent(new Event('click'));

    expect(store.toggleStop).toHaveBeenCalledWith({ routeId: 'ruta-1', stop });
  });

  it('debe mostrar carga, vacío y error', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="rutas-empty"]')).not.toBeNull();

    error.set('No se pudieron cargar las rutas.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="rutas-error"]').textContent,
    ).toContain('No se pudieron cargar las rutas.');
  });
});
