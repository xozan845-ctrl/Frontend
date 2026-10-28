import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PersonalStore } from './personal.store';
import { PERSONAL_REPOSITORY, PersonalRepository } from '../../repositories/personal.repository';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { FieldEmployee } from '../../models/personal.model';

const employee: FieldEmployee = {
  id: 'personal-1',
  name: 'Ana',
  lastName: 'Pérez',
  cargo: 'conductor',
  status: 'en_ruta',
  phone: '+505 7777 2222',
  email: 'ana@tienda.test',
  assignedRouteId: 'ruta-1',
  assignedVehicleId: 'vehiculo-1',
  checkIn: '2026-10-23T08:00:00.000Z',
  checkOut: null,
  lat: 12.136,
  lng: -86.251,
  locationTimestamp: '2026-10-23T10:30:00.000Z',
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-23T10:30:00.000Z',
};

const resting: FieldEmployee = {
  ...employee,
  id: 'personal-2',
  name: 'Luis',
  lastName: 'Méndez',
  cargo: 'auxiliar',
  status: 'descansando',
  email: '',
  phone: '',
  assignedRouteId: null,
  assignedVehicleId: null,
  lat: null,
  lng: null,
};

describe('PersonalStore', () => {
  let repo: PersonalRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = { list: vi.fn(() => of<FieldEmployee[]>([employee, resting])) };
    TestBed.configureTestingModule({
      providers: [
        PersonalStore,
        { provide: PERSONAL_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(PersonalStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar el personal y seleccionar el primero', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.employees()).toHaveLength(2));
    expect(store.selectedEmployee()?.id).toBe('personal-1');
    expect(store.totalEmployees()).toBe(2);
    expect(store.onRouteCount()).toBe(1);
    expect(store.availableCount()).toBe(1);
    expect(store.offlineCount()).toBe(1);
  });

  it('debe filtrar por nombre y estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.employees()).toHaveLength(2));

    store.setQuery('luis');
    expect(store.filteredEmployees().map((item) => item.id)).toEqual(['personal-2']);

    store.setQuery('');
    store.setStatusFilter('en_ruta');
    expect(store.filteredEmployees().map((item) => item.id)).toEqual(['personal-1']);

    store.setStatusFilter(null);
    expect(store.filteredEmployees()).toHaveLength(2);
  });

  it('debe seleccionar un colaborador', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.employees()).toHaveLength(2));

    store.selectEmployee('personal-2');
    expect(store.selectedEmployee()?.name).toBe('Luis');

    store.selectEmployee(null);
    expect(store.selectedEmployee()).toBeNull();
  });

  it('debe registrar el error de carga', async () => {
    const store = setup();
    vi.mocked(repo.list).mockReturnValue(throwError(() => new Error('')));

    store.load();

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo cargar el personal.'));
    expect(notification.showError).toHaveBeenCalledWith('No se pudo cargar el personal.');
  });

  it('debe limpiar y reiniciar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.employees()).toHaveLength(2));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.employees()).toEqual([]);
    expect(store.selectedEmployeeId()).toBeNull();
    expect(store.query()).toBe('');
  });
});
