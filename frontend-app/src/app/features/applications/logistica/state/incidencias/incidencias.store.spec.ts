import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IncidenciasStore } from './incidencias.store';
import {
  INCIDENCIA_REPOSITORY,
  IncidenciaRepository,
} from '../../repositories/incidencia.repository';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { FieldIncident } from '../../models/incidencia.model';

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

describe('IncidenciasStore', () => {
  let repo: IncidenciaRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      list: vi.fn(() => of<FieldIncident[]>([incident, resolved])),
      update: vi.fn(() => of<FieldIncident>({ ...incident, status: 'en_progreso' })),
    };
    TestBed.configureTestingModule({
      providers: [
        IncidenciasStore,
        { provide: INCIDENCIA_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(IncidenciasStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar incidencias y seleccionar la primera', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.incidents()).toHaveLength(2));
    expect(store.selectedIncident()?.id).toBe('incidencia-1');
    expect(store.openCount()).toBe(1);
    expect(store.inProgressCount()).toBe(0);
    expect(store.resolvedCount()).toBe(1);
  });

  it('debe filtrar por estado y seleccionar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.incidents()).toHaveLength(2));

    store.setStatusFilter('resuelta');
    expect(store.filteredIncidents().map((item) => item.id)).toEqual(['incidencia-2']);

    store.selectIncident('incidencia-2');
    expect(store.selectedIncident()?.id).toBe('incidencia-2');

    store.setStatusFilter(null);
    expect(store.filteredIncidents()).toHaveLength(2);
  });

  it('debe actualizar estado y resolución', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.incidents()).toHaveLength(2));

    store.updateIncident({
      id: 'incidencia-1',
      status: 'en_progreso',
      resolution: 'En taller',
    });

    await vi.waitFor(() => expect(store.selectedIncident()?.status).toBe('en_progreso'));
    expect(repo.update).toHaveBeenCalledWith('incidencia-1', {
      status: 'en_progreso',
      resolution: 'En taller',
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Incidencia actualizada.');
  });

  it('debe registrar errores de carga y actualización', async () => {
    const store = setup();
    vi.mocked(repo.list).mockReturnValue(throwError(() => new Error('')));

    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar las incidencias.'));

    vi.mocked(repo.list).mockReturnValue(of<FieldIncident[]>([incident]));
    store.load();
    await vi.waitFor(() => expect(store.incidents()).toHaveLength(1));

    vi.mocked(repo.update).mockReturnValue(throwError(() => new Error('')));
    store.updateIncident({ id: 'incidencia-1', status: 'resuelta' });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar la incidencia.'));
    expect(store.savingId()).toBeNull();
  });

  it('debe limpiar y reiniciar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.incidents()).toHaveLength(2));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.incidents()).toEqual([]);
    expect(store.selectedIncidentId()).toBeNull();
  });
});
