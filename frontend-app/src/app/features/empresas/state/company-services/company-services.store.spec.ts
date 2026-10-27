import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { companyServicesStorageKey } from '../../constants/company-services.constants';
import type { CompanyService, CompanyServiceStatus } from '../../models/company-service.model';
import { CompanyServicesStore } from './company-services.store';

const TENANT = 'e-1';
const STORAGE_KEY = companyServicesStorageKey(TENANT);

function makeService(index: number, overrides: Partial<CompanyService> = {}): CompanyService {
  return {
    id: `srv-${index}`,
    companyId: TENANT,
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

describe('CompanyServicesStore', () => {
  const user = signal({
    id: 'u-1',
    name: 'Eva',
    email: 'eva@empresa.test',
    role: 'empresario',
    tenantId: TENANT,
  });
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        CompanyServicesStore,
        { provide: AuthStore, useValue: { user: user.asReadonly() } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyServicesStore);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar sin servicios', () => {
    const store = setup();

    expect(store.services()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.hasServices()).toBe(false);
    expect(store.pageCount()).toBe(1);
  });

  it('debe crear un servicio y notificarlo', () => {
    const store = setup();

    const result = store.create({
      code: ' srv-010 ',
      name: 'Instalación',
      description: 'En sitio',
      category: 'Campo',
      price: '250.50',
      durationMinutes: 120,
    });

    expect(result.ok).toBe(true);
    expect(store.services()).toHaveLength(1);
    expect(store.services()[0]).toMatchObject({
      code: 'SRV-010',
      name: 'Instalación',
      brand: '',
      barcode: '',
      price: 250.5,
      cost: 0,
      unit: 'Hora (h)',
      durationMinutes: 120,
      status: 'activo',
    });
    expect(store.activeCount()).toBe(1);
    expect(notification.showSuccess).toHaveBeenCalledWith('Servicio "Instalación" creado.');
  });

  it('debe rechazar códigos duplicados sin distinguir mayúsculas', () => {
    const store = setup();
    store.create({ code: 'SRV-001', name: 'Uno', price: '100', durationMinutes: 30 });

    const result = store.create({
      code: 'srv-001',
      name: 'Dos',
      price: '200',
      durationMinutes: 60,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('código');
    expect(store.services()).toHaveLength(1);
  });

  it('debe actualizar los datos editables de un servicio', () => {
    const store = setup();
    const created = store.create({
      code: 'SRV-001',
      name: 'Uno',
      price: '100',
      durationMinutes: 30,
    }).service;

    const result = store.update(created!.id, {
      name: 'Uno actualizado',
      price: '300',
      cost: '120',
      brand: 'Marca',
      barcode: '123',
      unit: 'Servicio',
      durationMinutes: 45,
      status: 'inactivo',
    });

    expect(result.ok).toBe(true);
    expect(store.services()[0]).toMatchObject({
      name: 'Uno actualizado',
      price: 300,
      cost: 120,
      brand: 'Marca',
      barcode: '123',
      unit: 'Servicio',
      durationMinutes: 45,
      status: 'inactivo',
    });
    expect(notification.showSuccess).toHaveBeenCalledWith(
      'Servicio "Uno actualizado" actualizado.',
    );
  });

  it('debe eliminar un servicio', () => {
    const store = setup();
    const created = store.create({
      code: 'SRV-001',
      name: 'Uno',
      price: '100',
      durationMinutes: 30,
    }).service;

    const result = store.remove(created!.id);

    expect(result.ok).toBe(true);
    expect(store.services()).toEqual([]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Servicio "Uno" eliminado.');
  });

  it('debe filtrar por texto, categoría, marca y estado', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        makeService(1, {
          name: 'Instalación de red',
          category: 'Campo',
          brand: 'Marca Demo',
          status: 'activo',
        }),
        makeService(2, {
          name: 'Soporte remoto',
          category: 'Soporte',
          brand: 'Otra marca',
          status: 'inactivo',
        }),
      ]),
    );
    const store = setup();

    store.setSearch('instalacion');
    expect(store.filteredServices()).toHaveLength(1);
    expect(store.filteredServices()[0].name).toBe('Instalación de red');

    store.setSearch('');
    store.setCategory('Soporte');
    expect(store.filteredServices()).toHaveLength(1);
    expect(store.filteredServices()[0].name).toBe('Soporte remoto');

    store.setCategory('');
    store.setBrand('Marca Demo');
    expect(store.filteredServices()).toHaveLength(1);
    expect(store.filteredServices()[0].name).toBe('Instalación de red');

    store.setBrand('');
    store.setStatus('inactivo' as CompanyServiceStatus);
    expect(store.filteredServices()).toHaveLength(1);
    expect(store.hasFilters()).toBe(true);

    store.clearFilters();
    expect(store.filteredServices()).toHaveLength(2);
    expect(store.hasFilters()).toBe(false);
  });

  it('debe exponer filas de catálogo y ordenar', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([makeService(1, { name: 'Zeta' }), makeService(2, { name: 'Alfa' })]),
    );
    const store = setup();

    expect(store.serviceRows()).toHaveLength(2);
    expect(store.pagedRows()[0].name).toBe('Alfa');
    expect(store.brands()).toContain('Marca Demo');
    expect(store.categories()).toContain('Soporte');

    store.setSort('nombre-za');
    expect(store.pagedRows()[0].name).toBe('Zeta');
  });

  it('debe paginar los servicios filtrados', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from({ length: 12 }, (_, index) => makeService(index + 1))),
    );
    const store = setup();

    expect(store.total()).toBe(12);
    expect(store.pageCount()).toBe(2);
    expect(store.pagedServices()).toHaveLength(10);
    expect(store.isFirstPage()).toBe(true);
    expect(store.isLastPage()).toBe(false);

    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedServices()).toHaveLength(2);
    expect(store.isLastPage()).toBe(true);
    expect(store.isFirstPage()).toBe(false);

    store.previousPage();
    expect(store.currentPage()).toBe(1);
  });

  it('debe cargar los servicios guardados del tenant activo', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeService(1)]));
    localStorage.setItem(
      companyServicesStorageKey('otra-empresa'),
      JSON.stringify([makeService(2)]),
    );

    const store = setup();

    expect(store.services()).toHaveLength(1);
    expect(store.services()[0].id).toBe('srv-1');
  });

  it('debe ignorar un storage corrupto', () => {
    localStorage.setItem(STORAGE_KEY, '{no-es-json');

    const store = setup();

    expect(store.services()).toEqual([]);
  });

  it('debe persistir los cambios en el storage del tenant', async () => {
    const store = setup();
    store.create({ code: 'SRV-001', name: 'Uno', price: '100', durationMinutes: 30 });

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown[];
      expect(stored).toHaveLength(1);
    });
  });

  it('debe rechazar una creación con precio inválido', () => {
    const store = setup();

    const result = store.create({
      code: 'SRV-001',
      name: 'Uno',
      price: 'gratis',
      durationMinutes: 30,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('precio');
    expect(store.services()).toEqual([]);
  });

  it('debe informar cuando el servicio a actualizar o eliminar no existe', () => {
    const store = setup();

    expect(store.update('srv-inexistente', { name: 'Nuevo' }).ok).toBe(false);
    expect(store.remove('srv-inexistente').ok).toBe(false);
  });

  it('no debe navegar fuera de los límites de paginación', () => {
    const store = setup();

    store.previousPage();
    expect(store.currentPage()).toBe(1);

    store.setPage(0);
    expect(store.currentPage()).toBe(1);

    store.nextPage();
    expect(store.currentPage()).toBe(1);
  });

  it('debe reiniciar el estado y los filtros', () => {
    const store = setup();
    store.create({ code: 'SRV-001', name: 'Uno', price: '100', durationMinutes: 30 });
    store.setSearch('uno');
    store.setStatus('activo');

    store.reset();

    expect(store.services()).toEqual([]);
    expect(store.search()).toBe('');
    expect(store.status()).toBeNull();
    expect(store.page()).toBe(1);
  });

  it('debe crear y actualizar desde el formulario del modal', () => {
    const store = setup();
    const result = store.createFromForm({
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
    });

    expect(result.ok).toBe(true);
    expect(store.services()[0]).toMatchObject({ code: 'SRV-FORM', cost: 50, brand: 'Marca' });

    const updated = store.updateFromForm(store.services()[0].id, {
      type: 'servicio',
      name: 'Soporte express',
      description: '',
      category: 'Servicios',
      code: 'SRV-FORM',
      brand: 'Marca',
      barcode: '',
      cost: '60.00',
      price: '180.00',
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
      status: 'inactivo',
      createdAt: '2026-10-27',
      durationMinutes: 60,
    });

    expect(updated.ok).toBe(true);
    expect(store.services()[0]).toMatchObject({ name: 'Soporte express', cost: 60 });
    expect(store.lastSaved()?.name).toBe('Soporte express');
    expect(store.inventoryCsv()).toContain('Soporte express');
    store.acknowledgeSaved();
    expect(store.lastSaved()).toBeNull();
  });

  it('debe cambiar filtros de marca, orden y categoría', () => {
    const store = setup();
    expect(store.hasFilteredServices()).toBe(false);
    store.setCategory('Soporte');
    store.setBrand('Marca');
    store.setSort('precio-desc');
    store.setPage(2);

    expect(store.category()).toBe('Soporte');
    expect(store.brand()).toBe('Marca');
    expect(store.sort()).toBe('precio-desc');
    expect(store.page()).toBe(2);
    expect(store.hasFilters()).toBe(true);
  });

  it('debe informar una actualización inválida', () => {
    const store = setup();
    const created = store.create({
      code: 'SRV-001',
      name: 'Uno',
      price: '100',
      durationMinutes: 30,
    }).service!;

    const result = store.update(created.id, { price: 'gratis' });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('precio');
  });
});
