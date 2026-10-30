import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { COMPANY_SERVICE_REPOSITORY } from '../../repositories/company-service.repository';
import type { CompanyService } from '../../models/company-service.model';
import type { CompanyCatalogFormValue } from '../../models/company-catalog.model';
import { CompanyServicesStore } from './company-services.store';

function makeService(index: number, overrides: Partial<CompanyService> = {}): CompanyService {
  return {
    id: `srv-${index}`,
    companyId: 'e-1',
    code: `SRV-${String(index).padStart(3, '0')}`,
    name: `Servicio ${index}`,
    description: 'Demo',
    category: index % 2 === 0 ? 'Soporte' : 'Campo',
    brand: index % 2 === 0 ? 'Marca Demo' : 'Otra marca',
    barcode: `75000000000${index}`,
    price: 100 + index,
    cost: 50 + index,
    unit: 'Hora (h)',
    durationMinutes: 30,
    status: index % 2 === 0 ? 'activo' : 'inactivo',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    ...overrides,
  };
}

function makeForm(overrides: Partial<CompanyCatalogFormValue> = {}): CompanyCatalogFormValue {
  return {
    type: 'servicio',
    name: 'Soporte',
    description: 'Demo',
    category: 'Servicios',
    code: 'SRV-FORM',
    brand: 'Marca',
    barcode: '123',
    cost: '50.00',
    price: '150.00',
    unit: 'Hora (h)',
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    stock: 0,
    minStock: 0,
    maxStock: null,
    warrantyMonths: null,
    isRawMaterial: false,
    location: '',
    status: 'activo',
    createdAt: '2026-10-27',
    durationMinutes: 90,
    ...overrides,
  };
}

describe('CompanyServicesStore', () => {
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  let repo: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const setup = () => {
    repo = {
      list: vi.fn(() => of([makeService(1), makeService(2)])),
      create: vi.fn(() => of(makeService(9, { code: 'SRV-009', name: 'Instalación' }))),
      update: vi.fn(() => of(makeService(1, { name: 'Uno actualizado', status: 'inactivo' }))),
      remove: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        CompanyServicesStore,
        { provide: COMPANY_SERVICE_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyServicesStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar sin servicios y cargar desde el backend', async () => {
    const store = setup();
    expect(store.services()).toEqual([]);

    store.load();

    await vi.waitFor(() => expect(store.total()).toBe(2));
    expect(repo.list).toHaveBeenCalledTimes(1);
    expect(store.loading()).toBe(false);
    expect(store.activeCount()).toBe(1);
  });

  it('debe crear un servicio con la respuesta del API', async () => {
    const store = setup();

    store.create(makeForm());

    await vi.waitFor(() => expect(store.total()).toBe(1));
    expect(repo.create).toHaveBeenCalledWith({
      code: 'SRV-FORM',
      name: 'Soporte',
      description: 'Demo',
      category: 'Servicios',
      brand: 'Marca',
      barcode: '123',
      price: '150.00',
      cost: '50.00',
      unit: 'Hora (h)',
      durationMinutes: 90,
      status: 'activo',
    });
    expect(store.services()[0]).toMatchObject({ id: 'srv-9', code: 'SRV-009' });
    expect(store.lastSaved()?.id).toBe('srv-9');
    expect(notification.showSuccess).toHaveBeenCalledWith('Servicio "Instalación" creado.');
  });

  it('debe rechazar códigos duplicados sin llamar al API', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.create(makeForm({ code: 'srv-001' }));

    await vi.waitFor(() => expect(store.error()).toContain('código'));
    expect(repo.create).not.toHaveBeenCalled();
    expect(store.total()).toBe(2);
  });

  it('debe actualizar un servicio con la respuesta del backend', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.update({ id: 'srv-1', form: makeForm({ name: 'Uno actualizado', status: 'inactivo' }) });

    await vi.waitFor(() =>
      expect(store.services().find((service) => service.id === 'srv-1')?.name).toBe(
        'Uno actualizado',
      ),
    );
    expect(repo.update).toHaveBeenCalledWith(
      'srv-1',
      expect.objectContaining({
        name: 'Uno actualizado',
        price: '150.00',
        durationMinutes: 90,
        status: 'inactivo',
      }),
    );
    expect(store.lastSaved()?.name).toBe('Uno actualizado');
  });

  it('debe eliminar un servicio solo cuando el API confirma', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.remove('srv-1');

    await vi.waitFor(() => expect(store.total()).toBe(1));
    expect(repo.remove).toHaveBeenCalledWith('srv-1');
    expect(store.lastRemovedId()).toBe('srv-1');
    expect(notification.showSuccess).toHaveBeenCalledWith('Servicio "Servicio 1" eliminado.');
  });

  it('no debe borrar la fila si el backend rechaza la baja', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));
    repo.remove = vi.fn(() => throwError(() => new Error('baja falló')));

    store.remove('srv-1');

    await vi.waitFor(() => expect(store.error()).toBe('baja falló'));
    expect(store.total()).toBe(2);
    expect(store.lastRemovedId()).toBeNull();
  });

  it('debe validar precio, costo, código y duración', async () => {
    const store = setup();

    store.create(makeForm({ price: 'gratis' }));
    await vi.waitFor(() => expect(store.error()).toContain('precio'));

    store.create(makeForm({ cost: 'abc' }));
    await vi.waitFor(() => expect(store.error()).toContain('costo'));

    store.create(makeForm({ code: 'x' }));
    await vi.waitFor(() => expect(store.error()).toContain('código'));

    store.create(makeForm({ durationMinutes: 0 }));
    await vi.waitFor(() => expect(store.error()).toContain('duración'));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('debe informar el error de carga', async () => {
    const store = setup();
    repo.list = vi.fn(() => throwError(() => new Error('sin conexión')));

    store.load();

    await vi.waitFor(() => expect(store.error()).toBe('sin conexión'));
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');
  });

  it('debe filtrar por texto, categoría, marca y estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.setSearch('servicio 2');
    expect(store.filteredServices()).toHaveLength(1);
    expect(store.filteredServices()[0].id).toBe('srv-2');

    store.setSearch('');
    store.setCategory('Soporte');
    expect(store.filteredServices()[0].id).toBe('srv-2');

    store.setCategory('');
    store.setBrand('Otra marca');
    expect(store.filteredServices()[0].id).toBe('srv-1');

    store.setBrand('');
    store.setStatus('inactivo');
    expect(store.filteredServices()[0].id).toBe('srv-1');
    expect(store.hasFilters()).toBe(true);

    store.clearFilters();
    expect(store.filteredServices()).toHaveLength(2);
    expect(store.hasFilters()).toBe(false);
  });

  it('debe exponer filas de catálogo, ordenar y paginar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    expect(store.serviceRows()).toHaveLength(2);
    expect(store.pagedRows()[0].name).toBe('Servicio 1');
    expect(store.brands()).toContain('Marca Demo');
    expect(store.categories()).toContain('Soporte');

    store.setSort('nombre-za');
    expect(store.pagedRows()[0].name).toBe('Servicio 2');

    repo.list = vi.fn(() => of(Array.from({ length: 12 }, (_, index) => makeService(index + 1))));
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(12));
    expect(store.pageCount()).toBe(2);
    expect(store.pagedServices()).toHaveLength(10);
    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedServices()).toHaveLength(2);
    store.previousPage();
    expect(store.currentPage()).toBe(1);
  });

  it('debe crear y actualizar desde el formulario y limpiar la confirmación', async () => {
    const store = setup();
    store.create(makeForm());
    await vi.waitFor(() => expect(store.lastSaved()?.name).toBe('Instalación'));
    expect(store.inventoryCsv()).toContain('Instalación');
    store.acknowledgeSaved();
    expect(store.lastSaved()).toBeNull();

    store.acknowledgeRemoved();
    expect(store.lastRemovedId()).toBeNull();
  });

  it('no debe navegar fuera de los límites de paginación ni perder filtros', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.previousPage();
    expect(store.currentPage()).toBe(1);
    store.setPage(0);
    expect(store.currentPage()).toBe(1);
    store.nextPage();
    expect(store.currentPage()).toBe(1);

    store.setCategory('Soporte');
    store.setBrand('Marca');
    store.setSort('precio-desc');
    store.setPage(2);
    expect(store.category()).toBe('Soporte');
    expect(store.brand()).toBe('Marca');
    expect(store.sort()).toBe('precio-desc');
    expect(store.page()).toBe(2);
  });

  it('debe reiniciar el estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));
    store.setSearch('uno');
    store.setStatus('activo');

    store.reset();

    expect(store.services()).toEqual([]);
    expect(store.search()).toBe('');
    expect(store.status()).toBeNull();
    expect(store.page()).toBe(1);
  });
});
