import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import IncidenciasComponent from './incidencias.component';
import { IncidenciasStore } from '../../state/incidencias/incidencias.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import type { FieldIncident } from '../../models/incidencia.model';

const incident: FieldIncident = {
  id: 'incidencia-1',
  type: 'mecanica',
  status: 'abierta',
  description: 'Llanta pinchada.',
  personalId: 'personal-1',
  vehicleId: 'vehiculo-1',
  routeId: 'ruta-1',
  resolution: '',
  createdAt: '2026-10-23T09:00:00.000Z',
  updatedAt: '2026-10-23T09:00:00.000Z',
};

const resolved: FieldIncident = {
  ...incident,
  id: 'incidencia-2',
  type: 'clima',
  status: 'resuelta',
  description: 'Lluvia fuerte.',
  resolution: 'Reprogramada',
};

describe('IncidenciasComponent', () => {
  const incidents = signal<FieldIncident[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const selectedIncidentId = signal<string | null>(null);
  const statusFilter = signal<string | null>(null);
  const savingId = signal<string | null>(null);
  const filteredIncidents = computed(() =>
    statusFilter() ? incidents().filter((item) => item.status === statusFilter()) : incidents(),
  );
  const selectedIncident = computed(
    () => incidents().find((item) => item.id === selectedIncidentId()) ?? null,
  );
  const store = {
    incidents: incidents.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    selectedIncidentId: selectedIncidentId.asReadonly(),
    statusFilter: statusFilter.asReadonly(),
    savingId: savingId.asReadonly(),
    filteredIncidents,
    selectedIncident,
    totalIncidents: computed(() => incidents().length),
    openCount: computed(() => incidents().filter((item) => item.status === 'abierta').length),
    inProgressCount: computed(
      () => incidents().filter((item) => item.status === 'en_progreso').length,
    ),
    resolvedCount: computed(() => incidents().filter((item) => item.status === 'resuelta').length),
    load: vi.fn(),
    selectIncident: vi.fn((id: string | null) => selectedIncidentId.set(id)),
    setStatusFilter: vi.fn((value: string | null) => statusFilter.set(value)),
    updateIncident: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [IncidenciasComponent],
      providers: [
        { provide: IncidenciasStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(IncidenciasComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    incidents.set([]);
    loading.set(false);
    error.set(null);
    selectedIncidentId.set(null);
    statusFilter.set(null);
    savingId.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar incidencias al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe listar y mostrar el detalle', async () => {
    incidents.set([incident, resolved]);
    selectedIncidentId.set('incidencia-1');
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="incidencia-row"]')).toHaveLength(
      2,
    );
    expect(fixture.nativeElement.querySelector('[data-testid="incidencia-detail"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Llanta pinchada.');
  });

  it('debe filtrar y seleccionar una incidencia', async () => {
    incidents.set([incident, resolved]);
    selectedIncidentId.set('incidencia-1');
    const fixture = await setup();

    const filter = fixture.nativeElement.querySelector(
      '[data-testid="incidencias-status-filter"]',
    ) as HTMLSelectElement;
    filter.value = 'resuelta';
    filter.dispatchEvent(new Event('change'));
    expect(store.setStatusFilter).toHaveBeenCalledWith('resuelta');

    fixture.nativeElement
      .querySelector('[data-testid="incidencia-select-incidencia-2"]')
      .dispatchEvent(new Event('click'));
    expect(store.selectIncident).toHaveBeenCalledWith('incidencia-2');
  });

  it('debe guardar estado y resolución', async () => {
    incidents.set([incident]);
    selectedIncidentId.set('incidencia-1');
    const fixture = await setup();

    const status = fixture.nativeElement.querySelector(
      '[data-testid="incidencia-target-status"]',
    ) as HTMLSelectElement;
    status.value = 'en_progreso';
    status.dispatchEvent(new Event('change'));

    const resolution = fixture.nativeElement.querySelector(
      '[data-testid="incidencia-resolution"]',
    ) as HTMLTextAreaElement;
    resolution.value = 'En taller';
    resolution.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('[data-testid="incidencia-save"]')
      .dispatchEvent(new Event('click'));

    expect(store.updateIncident).toHaveBeenCalledWith({
      id: 'incidencia-1',
      status: 'en_progreso',
      resolution: 'En taller',
    });
  });

  it('debe mostrar carga, vacío y error', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="incidencias-empty"]')).not.toBeNull();

    error.set('No se pudieron cargar las incidencias.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="incidencias-error"]').textContent,
    ).toContain('No se pudieron cargar las incidencias.');
  });
});
