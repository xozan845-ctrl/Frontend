import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import PersonalComponent from './personal.component';
import { PersonalStore } from '../../state/personal/personal.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { FieldEmployee } from '../../models/personal.model';

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

describe('PersonalComponent', () => {
  const employees = signal<FieldEmployee[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const selectedEmployeeId = signal<string | null>(null);
  const query = signal('');
  const statusFilter = signal<string | null>(null);
  const filteredEmployees = computed(() =>
    employees().filter(
      (item) =>
        (!statusFilter() || item.status === statusFilter()) &&
        (!query() || `${item.name} ${item.lastName}`.toLowerCase().includes(query().toLowerCase())),
    ),
  );
  const selectedEmployee = computed(
    () => employees().find((item) => item.id === selectedEmployeeId()) ?? null,
  );
  const store = {
    employees: employees.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    selectedEmployeeId: selectedEmployeeId.asReadonly(),
    query: query.asReadonly(),
    statusFilter: statusFilter.asReadonly(),
    filteredEmployees,
    selectedEmployee,
    totalEmployees: computed(() => employees().length),
    onRouteCount: computed(() => employees().filter((item) => item.status === 'en_ruta').length),
    availableCount: computed(
      () => employees().filter((item) => ['activo', 'en_ruta'].includes(item.status)).length,
    ),
    offlineCount: computed(
      () => employees().filter((item) => ['descansando', 'inactivo'].includes(item.status)).length,
    ),
    load: vi.fn(),
    selectEmployee: vi.fn((id: string | null) => selectedEmployeeId.set(id)),
    setQuery: vi.fn((value: string) => query.set(value)),
    setStatusFilter: vi.fn((value: string | null) => statusFilter.set(value)),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalComponent],
      providers: [
        { provide: PersonalStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PersonalComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    employees.set([]);
    loading.set(false);
    error.set(null);
    selectedEmployeeId.set(null);
    query.set('');
    statusFilter.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar el personal al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe listar y mostrar la ficha seleccionada', async () => {
    employees.set([employee, resting]);
    selectedEmployeeId.set('personal-1');
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="personal-row"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('[data-testid="personal-detail"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('12.136');
  });

  it('debe buscar, filtrar y seleccionar', async () => {
    employees.set([employee, resting]);
    selectedEmployeeId.set('personal-1');
    const fixture = await setup();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="personal-search"]',
    ) as HTMLInputElement;
    search.value = 'luis';
    search.dispatchEvent(new Event('input'));
    expect(store.setQuery).toHaveBeenCalledWith('luis');

    const status = fixture.nativeElement.querySelector(
      '[data-testid="personal-status-filter"]',
    ) as HTMLSelectElement;
    status.value = 'descansando';
    status.dispatchEvent(new Event('change'));
    expect(store.setStatusFilter).toHaveBeenCalledWith('descansando');

    fixture.nativeElement
      .querySelector('[data-testid="personal-select-personal-2"]')
      .dispatchEvent(new Event('click'));
    expect(store.selectEmployee).toHaveBeenCalledWith('personal-2');
  });

  it('debe mostrar carga, vacío y error', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="personal-empty"]')).not.toBeNull();

    error.set('No se pudo cargar el personal.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="personal-error"]').textContent,
    ).toContain('No se pudo cargar el personal.');
  });
});
