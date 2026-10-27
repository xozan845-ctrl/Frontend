import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../products/repositories/catalog-product.repository';
import type { CatalogProduct } from '../../../products/models/catalog-product.model';
import { companyProductMetadataStorageKey } from '../../constants/company-products.constants';
import type { CompanyCatalogFormValue } from '../../models/company-catalog.model';
import { CompanyProductsStore } from './company-products.store';

const TENANT = 'e-1';
const STORAGE_KEY = companyProductMetadataStorageKey(TENANT);

function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: 'p-1',
    companyId: TENANT,
    sku: 'SKU-1',
    name: 'Teclado',
    description: 'Demo',
    category: 'Periféricos',
    basePrice: 100,
    stock: 10,
    status: 'disponible',
    createdAt: '2026-10-27T00:00:00.000Z',
    ...overrides,
  };
}

function makeForm(overrides: Partial<CompanyCatalogFormValue> = {}): CompanyCatalogFormValue {
  return {
    type: 'producto',
    name: 'Camisa',
    description: 'Demo',
    category: 'Ropa',
    code: 'CAM-1',
    brand: 'Marca Demo',
    barcode: '750123',
    cost: '150.00',
    price: '250.00',
    unit: 'Unidad (u)',
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    stock: 5,
    minStock: 2,
    maxStock: 20,
    warrantyMonths: 12,
    isRawMaterial: false,
    location: 'Estante 1',
    status: 'activo',
    createdAt: '2026-10-27',
    durationMinutes: 60,
    ...overrides,
  };
}

describe('CompanyProductsStore', () => {
  const user = signal({
    id: 'u-1',
    name: 'Eva',
    email: 'eva@empresa.test',
    role: 'empresario',
    tenantId: TENANT,
  });
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  let repo: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };

  const setup = () => {
    repo = {
      list: vi.fn((filters: { page?: number }) =>
        of({
          items:
            filters.page === 2
              ? [makeProduct({ id: 'p-2', name: 'Mouse', sku: 'SKU-2' })]
              : [makeProduct()],
          total: 2,
          page: filters.page ?? 1,
          limit: 100,
          pages: 2,
        }),
      ),
      create: vi.fn(() => of(makeProduct({ id: 'p-9', name: 'Camisa', sku: 'CAM-1' }))),
      update: vi.fn(() => of(makeProduct({ id: 'p-1', name: 'Teclado actualizado' }))),
      getById: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CompanyProductsStore,
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: repo },
        { provide: AuthStore, useValue: { user: user.asReadonly() } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyProductsStore);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar vacío', () => {
    const store = setup();

    expect(store.products()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.kpis().activeProducts).toBe(0);
  });

  it('debe cargar todas las páginas del API', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.products()).toHaveLength(2));
    expect(repo.list).toHaveBeenCalledWith({ page: 1, limit: 100 });
    expect(repo.list).toHaveBeenCalledWith({ page: 2, limit: 100 });
    expect(store.loading()).toBe(false);
    expect(store.total()).toBe(2);
    expect(store.hasProducts()).toBe(true);
    expect(store.isFirstPage()).toBe(true);
    expect(store.isLastPage()).toBe(true);
  });

  it('debe cargar una sola página sin pedir la siguiente', async () => {
    const store = setup();
    repo.list = vi.fn(() =>
      of({ items: [makeProduct()], total: 1, page: 1, limit: 100, pages: 1 }),
    );

    store.load();

    await vi.waitFor(() => expect(store.total()).toBe(1));
    expect(repo.list).toHaveBeenCalledTimes(1);
  });

  it('debe paginar localmente cuando hay más de diez filas', async () => {
    const store = setup();
    repo.list = vi.fn(() =>
      of({
        items: Array.from({ length: 12 }, (_, index) =>
          makeProduct({
            id: `p-${index + 1}`,
            name: `Producto ${index + 1}`,
            sku: `SKU-${index + 1}`,
          }),
        ),
        total: 12,
        page: 1,
        limit: 100,
        pages: 1,
      }),
    );

    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(12));

    expect(store.pageCount()).toBe(2);
    expect(store.pagedRows()).toHaveLength(10);
    expect(store.hasFilteredProducts()).toBe(true);
    expect(store.isLastPage()).toBe(false);

    store.setPage(2);
    expect(store.currentPage()).toBe(2);
    expect(store.pagedRows()).toHaveLength(2);
    expect(store.isFirstPage()).toBe(false);
    expect(store.isLastPage()).toBe(true);

    store.previousPage();
    expect(store.currentPage()).toBe(1);
  });

  it('debe crear un producto y guardar metadatos locales', async () => {
    const store = setup();

    store.create(makeForm());

    await vi.waitFor(() => expect(store.products()).toHaveLength(1));
    expect(repo.create).toHaveBeenCalledWith({
      sku: 'CAM-1',
      name: 'Camisa',
      description: 'Demo',
      category: 'Ropa',
      basePrice: '250.00',
      stock: 5,
    });
    expect(store.metadata()['p-9']).toMatchObject({
      cost: 150,
      brand: 'Marca Demo',
      minStock: 2,
      isRawMaterial: false,
      statusOverride: 'activo',
    });
    expect(store.lastSaved()?.id).toBe('p-9');
    expect(notification.showSuccess).toHaveBeenCalledWith('Producto "Camisa" creado.');
    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
        string,
        unknown
      >;
      expect(stored['p-9']).toBeTruthy();
    });
  });

  it('debe actualizar un producto y sus metadatos', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.update({ id: 'p-1', data: makeForm({ name: 'Teclado actualizado' }) });

    await vi.waitFor(() =>
      expect(store.rows().find((row) => row.id === 'p-1')?.name).toBe('Teclado actualizado'),
    );
    expect(repo.update).toHaveBeenCalledWith('p-1', {
      name: 'Teclado actualizado',
      description: 'Demo',
      category: 'Ropa',
      basePrice: '250.00',
      stock: 5,
    });
    expect(store.lastSaved()?.id).toBe('p-1');
  });

  it('debe rechazar un producto con precio o costo inválido', () => {
    const store = setup();

    store.create(makeForm({ price: 'gratis' }));

    expect(repo.create).not.toHaveBeenCalled();
    expect(store.error()).toContain('precio');
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe filtrar, ordenar y paginar localmente', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'p-1': { brand: 'Marca Demo', cost: 50, minStock: 2, isRawMaterial: false },
        'p-2': { brand: 'Otra marca', cost: 20, minStock: 20, isRawMaterial: true },
      }),
    );
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.setQuery('mouse');
    expect(store.filteredRows()).toHaveLength(1);
    expect(store.filteredRows()[0].name).toBe('Mouse');

    store.setQuery('');
    store.setBrand('Marca Demo');
    expect(store.filteredRows()).toHaveLength(1);

    store.setBrand('');
    store.setStatus('stock-bajo');
    expect(store.filteredRows()).toHaveLength(1);
    expect(store.filteredRows()[0].name).toBe('Mouse');

    store.setStatus('todos');
    store.setOnlyRawMaterial(true);
    expect(store.filteredRows()).toHaveLength(1);
    expect(store.filteredRows()[0].name).toBe('Mouse');

    store.setOnlyRawMaterial(false);
    store.setSort('nombre-az');
    expect(store.pagedRows()[0].name).toBe('Mouse');

    store.setPage(2);
    expect(store.currentPage()).toBe(1);
    expect(store.nextPage()).toBeUndefined();
  });

  it('debe exponer KPIs, categorías, marcas y CSV', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    expect(store.kpis().activeProducts).toBe(2);
    expect(store.kpis().inventoryOk).toBe(2);
    expect(store.kpis().rawMaterial).toBe(0);
    expect(store.categories()).toContain('Periféricos');
    expect(store.brands()).toEqual([]);
    expect(store.templateCsv()).toContain('nombre,descripcion');
    expect(store.inventoryCsv()).toContain('Teclado');
  });

  it('debe calcular marcas, categorías y materia prima con metadatos', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'p-1': { brand: 'Marca A', isRawMaterial: false },
        'p-2': { brand: 'Marca B', isRawMaterial: true },
      }),
    );
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    expect(store.brands()).toEqual(['Marca A', 'Marca B']);
    expect(store.categories()).toEqual(['Periféricos']);
    expect(store.rawMaterialCount()).toBe(1);
  });

  it('debe informar el error de carga', async () => {
    const store = setup();
    repo.list = vi.fn(() => throwError(() => new Error('sin conexión')));

    store.load();

    await vi.waitFor(() => expect(store.error()).toBe('sin conexión'));
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');
  });

  it('debe informar errores de creación y actualización', async () => {
    const store = setup();
    repo.create = vi.fn(() => throwError(() => new Error('alta falló')));
    store.create(makeForm());
    await vi.waitFor(() => expect(store.error()).toBe('alta falló'));

    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));
    store.clearError();
    repo.update = vi.fn(() => throwError(() => new Error('edición falló')));
    store.update({ id: 'p-1', data: makeForm() });
    await vi.waitFor(() => expect(store.error()).toBe('edición falló'));
  });

  it('debe rechazar precios y costos inválidos al crear o editar', async () => {
    const store = setup();

    store.create(makeForm({ cost: 'abc' }));
    expect(repo.create).not.toHaveBeenCalled();
    expect(store.error()).toContain('precio');

    store.clearError();
    store.update({ id: 'p-1', data: makeForm({ price: 'abc' }) });
    expect(repo.update).not.toHaveBeenCalled();
    expect(store.error()).toContain('precio');
  });

  it('debe recorrer filtros, orden, paginación y limpieza', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'p-1': { brand: 'Marca Demo', cost: 50, minStock: 2 },
        'p-2': { brand: 'Otra marca', cost: 20, minStock: 20, isRawMaterial: true },
      }),
    );
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.setStatus('activos');
    expect(store.filteredRows()).toHaveLength(2);
    store.setStatus('inactivos');
    expect(store.filteredRows()).toHaveLength(0);
    store.setStatus('stock-bajo');
    expect(store.filteredRows()).toHaveLength(1);

    store.setStatus('todos');
    store.setBrand('Marca Demo');
    expect(store.filteredRows()).toHaveLength(1);
    store.setBrand('');
    store.setQuery('mouse');
    expect(store.filteredRows()).toHaveLength(1);
    store.setOnlyRawMaterial(true);
    expect(store.filteredRows()).toHaveLength(1);
    store.setOnlyRawMaterial(false);
    store.setQuery('');
    expect(store.hasFilters()).toBe(false);

    for (const sort of [
      'nombre-az',
      'nombre-za',
      'precio-asc',
      'precio-desc',
      'stock-asc',
      'stock-desc',
      'reciente',
    ] as const) {
      store.setSort(sort);
      expect(store.pagedRows()).toHaveLength(2);
    }

    store.setPage(0);
    expect(store.currentPage()).toBe(1);
    store.nextPage();
    expect(store.currentPage()).toBe(1);
    store.previousPage();
    expect(store.currentPage()).toBe(1);

    store.setQuery('x');
    store.setBrand('Marca');
    store.setStatus('inactivos');
    store.clearFilters();
    expect(store.query()).toBe('');
    expect(store.brand()).toBe('');
    expect(store.status()).toBe('todos');
  });

  it('debe reconocer el guardado, limpiar el error y reiniciar', () => {
    const store = setup();
    store.acknowledgeSaved();
    expect(store.lastSaved()).toBeNull();
    store.clearError();
    expect(store.error()).toBeNull();
    store.reset();
    expect(store.products()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('debe limpiar filtros y reiniciar', async () => {
    const store = setup();
    store.setQuery('x');
    store.setBrand('Marca');
    store.setStatus('inactivos');

    store.clearFilters();
    expect(store.query()).toBe('');
    expect(store.brand()).toBe('');
    expect(store.status()).toBe('todos');

    store.reset();
    expect(store.products()).toEqual([]);
    expect(store.metadata()).toEqual({});
  });
});
