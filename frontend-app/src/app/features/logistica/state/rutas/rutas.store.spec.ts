import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RutasStore } from './rutas.store';
import { RUTA_REPOSITORY, RutaRepository } from '../../repositories/ruta.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { Parada, Ruta } from '../../models/ruta.model';

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

describe('RutasStore', () => {
  let repo: RutaRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      list: vi.fn(() => of<Ruta[]>([route])),
      updateStatus: vi.fn(() => of<Ruta>({ ...route, status: 'en_curso', stops: [] })),
      updateStop: vi.fn(() => of<Parada>({ ...stop, completed: true })),
    };
    TestBed.configureTestingModule({
      providers: [
        RutasStore,
        { provide: RUTA_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(RutasStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar rutas y seleccionar la primera', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));
    expect(store.selectedRoute()?.id).toBe('ruta-1');
    expect(store.totalStops()).toBe(1);
    expect(store.completedStops()).toBe(0);
  });

  it('debe seleccionar otra ruta y limpiar la selección', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));

    store.selectRoute('ruta-1');
    expect(store.selectedRouteId()).toBe('ruta-1');

    store.selectRoute(null);
    expect(store.selectedRoute()).toBeNull();
  });

  it('deriva la lista filtrada por estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));

    store.setStatusFilter('en_curso');
    expect(store.filteredRoutes()).toEqual([]);

    store.setStatusFilter('pendiente');
    expect(store.filteredRoutes()).toEqual([route]);

    store.setStatusFilter('');
    expect(store.filteredRoutes()).toEqual([route]);
  });

  it('debe cambiar el estado y conservar las paradas', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));

    store.updateStatus({ routeId: 'ruta-1', status: 'en_curso' });

    await vi.waitFor(() => expect(store.selectedRoute()?.status).toBe('en_curso'));
    expect(store.selectedRoute()?.stops).toHaveLength(1);
    expect(repo.updateStatus).toHaveBeenCalledWith('ruta-1', 'en_curso');
    expect(notification.showSuccess).toHaveBeenCalledWith('Estado de la ruta actualizado.');
  });

  it('debe completar una parada y actualizarla en la ruta', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));

    store.toggleStop({ routeId: 'ruta-1', stop });

    await vi.waitFor(() => expect(store.selectedRoute()?.stops[0].completed).toBe(true));
    expect(repo.updateStop).toHaveBeenCalledWith('ruta-1', 'parada-1', {
      name: 'Farmacia Central',
      completed: true,
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Parada completada.');
  });

  it('debe registrar errores de carga y mutaciones', async () => {
    const store = setup();
    vi.mocked(repo.list).mockReturnValue(throwError(() => new Error('')));

    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar las rutas.'));

    vi.mocked(repo.list).mockReturnValue(of<Ruta[]>([route]));
    store.load();
    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));

    vi.mocked(repo.updateStatus).mockReturnValue(throwError(() => new Error('')));
    store.updateStatus({ routeId: 'ruta-1', status: 'cancelada' });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar la ruta.'));
    expect(store.savingRouteId()).toBeNull();

    vi.mocked(repo.updateStop).mockReturnValue(throwError(() => new Error('')));
    store.toggleStop({ routeId: 'ruta-1', stop });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar la parada.'));
    expect(store.savingStopId()).toBeNull();
  });

  it('debe limpiar y reiniciar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.routes()).toHaveLength(1));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.routes()).toEqual([]);
    expect(store.selectedRouteId()).toBeNull();
  });
});
