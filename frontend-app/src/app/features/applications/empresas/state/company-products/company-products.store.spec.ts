import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../products/repositories/catalog-product.repository';
import type { CatalogProduct } from '../../../products/models/catalog-product.model';
import type { CompanyCatalogFormValue } from '../../models/company-catalog.model';
import { CompanyProductsStore } from './company-products.store';

function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: 'p-1',
    companyId: 'e-1',
    sku: 'SKU-1',
    name: 'Teclado',
    description: 'Demo',
    category: 'Periféricos',
    basePrice: 100,
    stock: 10,
    status: 'disponible',
    operationalStatus: 'activo',
    cost: 40,
    brand: 'Marca Demo',
    barcode: '750123',
    unit: 'Unidad (u)',
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    minStock: 2,
    maxStock: 20,
    warrantyMonths: null,
    isRawMaterial: false,
    location: '',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
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
              ? [makeProduct({ id: 'p-2', name: 'Mouse', sku: 'SKU-2', cost: 20 })]
              : [makeProduct()],
          total: 2,
          page: filters.page ?? 1,
          limit: 100,
          pages: 2,
        }),
      ),
      create: vi.fn(() => of(makeProduct({ id: 'p-9', name: 'Camisa', sku: 'CAM-1', cost: 150 }))),
      update: vi.fn(() => of(makeProduct({ id: 'p-1', name: 'Teclado actualizado', cost: 150 }))),
      getById: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CompanyProductsStore,
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyProductsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar vacío y sin metadatos locales', () => {
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
  });

  it('debe crear un producto enviando producto y metadatos juntos', async () => {
    const store = setup();

    store.create(makeForm());

    await vi.waitFor(() => expect(store.products()).toHaveLength(1));
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'CAM-1',
        name: 'Camisa',
        basePrice: '250.00',
        stock: 5,
        cost: '150.00',
        brand: 'Marca Demo',
        minStock: 2,
        operationalStatus: 'activo',
      }),
    );
    expect(store.rows()[0]).toMatchObject({ id: 'p-9', cost: 150, status: 'activo' });
    expect(store.lastSaved()?.id).toBe('p-9');
    expect(notification.showSuccess).toHaveBeenCalledWith('Producto "Camisa" creado.');
  });

  it('debe actualizar un producto con la respuesta del servidor', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.update({ id: 'p-1', data: makeForm({ name: 'Teclado actualizado' }) });

    await vi.waitFor(() =>
      expect(store.rows().find((row) => row.id === 'p-1')?.name).toBe('Teclado actualizado'),
    );
    expect(repo.update).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({ name: 'Teclado actualizado', cost: '150.00' }),
    );
    expect(store.lastSaved()?.id).toBe('p-1');
  });

  it('debe rechazar precios o costos inválidos sin llamar al API', () => {
    const store = setup();

    store.create(makeForm({ price: 'gratis' }));
    expect(repo.create).not.toHaveBeenCalled();
    expect(store.error()).toContain('precio');

    store.clearError();
    store.create(makeForm({ cost: 'abc' }));
    expect(repo.create).not.toHaveBeenCalled();
    expect(store.error()).toContain('costo');
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe filtrar, ordenar y paginar localmente', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    store.setQuery('mouse');
    expect(store.filteredRows()).toHaveLength(1);
    expect(store.filteredRows()[0].name).toBe('Mouse');

    store.setQuery('');
    store.setBrand('Marca Demo');
    expect(store.filteredRows()).toHaveLength(2);

    store.setBrand('');
    store.setStatus('stock-bajo');
    expect(store.filteredRows()).toHaveLength(0);

    store.setStatus('todos');
    store.setOnlyRawMaterial(true);
    expect(store.filteredRows()).toHaveLength(0);

    store.setOnlyRawMaterial(false);
    store.setSort('precio-desc');
    expect(store.pagedRows()[0].name).toBe('Teclado');
  });

  it('debe exponer KPIs, categorías, marcas y CSV', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

    expect(store.kpis()).toEqual({
      activeProducts: 2,
      inventoryValue: 600,
      missingCostCount: 0,
      inventoryOk: 2,
      rawMaterial: 0,
    });
    expect(store.categories()).toContain('Periféricos');
    expect(store.brands()).toEqual(['Marca Demo']);
    expect(store.templateCsv()).toContain('nombre,descripcion');
    expect(store.inventoryCsv()).toContain('Teclado');
  });

  it('debe marcar el inventario incompleto si algún producto no trae costo', async () => {
    const store = setup();
    repo.list = vi.fn(() => of({ items: [makeProduct({ cost: null })], total: 1, pages: 1 }));
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(1));

    expect(store.kpis().inventoryValue).toBeNull();
    expect(store.kpis().missingCostCount).toBe(1);
    expect(store.rows()[0].cost).toBeNull();
  });

  it('debe informar el error de carga', async () => {
    const store = setup();
    repo.list = vi.fn(() => throwError(() => new Error('sin conexión')));

    store.load();

    await vi.waitFor(() => expect(store.error()).toBe('sin conexión'));
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');
  });

  it('debe informar errores de creación y actualización sin dejar filas falsas', async () => {
    const store = setup();
    repo.create = vi.fn(() => throwError(() => new Error('alta falló')));
    store.create(makeForm());
    await vi.waitFor(() => expect(store.error()).toBe('alta falló'));
    expect(store.products()).toEqual([]);

    repo.list = vi.fn(() => of({ items: [makeProduct()], total: 1, pages: 1 }));
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(1));
    store.clearError();
    repo.update = vi.fn(() => throwError(() => new Error('edición falló')));
    store.update({ id: 'p-1', data: makeForm({ name: 'Otro' }) });
    await vi.waitFor(() => expect(store.error()).toBe('edición falló'));
    expect(store.rows()[0].name).toBe('Teclado');
  });

  it('debe recorrer filtros, orden, paginación y limpieza', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.total()).toBe(2));

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
});
