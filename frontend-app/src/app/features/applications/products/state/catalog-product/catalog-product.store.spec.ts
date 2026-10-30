import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CatalogProductsStore } from './catalog-product.store';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductRepository,
} from '../../repositories/catalog-product.repository';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { CatalogProduct } from '../../models/catalog-product.model';

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'e-1',
  sku: 'SKU-1',
  name: 'Teclado',
  description: '',
  category: 'Periféricos',
  basePrice: 100,
  stock: 5,
  status: 'disponible',
  operationalStatus: 'activo',
  cost: 60,
  brand: 'Marca Demo',
  barcode: '',
  unit: 'Unidad (u)',
  allowFractions: false,
  purchaseUnit: 'Igual que la de venta',
  contentAmount: 0,
  contentUnit: 'Sin contenido',
  priceType: 'fijo',
  costType: 'fijo',
  minStock: 2,
  maxStock: null,
  warrantyMonths: null,
  isRawMaterial: false,
  location: '',
  createdAt: '2026-10-21T00:00:00.000Z',
  updatedAt: '2026-10-21T00:00:00.000Z',
};

describe('CatalogProductsStore', () => {
  let repo: CatalogProductRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      list: vi.fn((filters: { page?: number; limit?: number }) =>
        of({
          items: [product],
          total: 1,
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          pages: 1,
        }),
      ),
      getById: vi.fn(() => of(product)),
      create: vi.fn(() => of(product)),
      update: vi.fn(() => of({ ...product, stock: 8 })),
    };
    TestBed.configureTestingModule({
      providers: [
        CatalogProductsStore,
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CatalogProductsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar sin productos', () => {
    const store = setup();

    expect(store.products()).toEqual([]);
    expect(store.hasProducts()).toBe(false);
    expect(store.page()).toBe(1);
  });

  it('debe cargar la página con los filtros actuales', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.products()).toEqual([product]));
    expect(repo.list).toHaveBeenCalledWith({
      q: '',
      status: undefined,
      category: '',
      page: 1,
      limit: 20,
    });
    expect(store.loading()).toBe(false);
  });

  it('debe aplicar búsqueda y volver a la página 1', async () => {
    const store = setup();
    store.goToPage(3);
    await vi.waitFor(() => expect(store.page()).toBe(3));

    store.setQuery('teclado');

    await vi.waitFor(() => expect(store.query()).toBe('teclado'));
    expect(store.page()).toBe(1);
    expect(repo.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'teclado', page: 1 }));
  });

  it('debe aplicar filtros de estado y categoría', async () => {
    const store = setup();

    store.setStatus('agotado');
    await vi.waitFor(() => expect(store.status()).toBe('agotado'));
    store.setCategory('Periféricos');
    await vi.waitFor(() => expect(store.category()).toBe('Periféricos'));

    expect(repo.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'agotado', category: 'Periféricos', page: 1 }),
    );
  });

  it('debe crear un producto y exponer lastSaved', async () => {
    const store = setup();

    store.create({ sku: 'SKU-1', name: 'Teclado', basePrice: '100.00', stock: 5 });

    await vi.waitFor(() => expect(store.lastSaved()).toEqual(product));
    expect(repo.create).toHaveBeenCalledWith({
      sku: 'SKU-1',
      name: 'Teclado',
      basePrice: '100.00',
      stock: 5,
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Producto "Teclado" creado.');
    expect(store.saving()).toBe(false);
  });

  it('debe actualizar un producto y exponer lastSaved', async () => {
    const store = setup();

    store.update({ id: 'p-1', data: { stock: 8 } });

    await vi.waitFor(() => expect(store.lastSaved()?.stock).toBe(8));
    expect(repo.update).toHaveBeenCalledWith('p-1', { stock: 8 });
  });

  it('debe registrar errores de carga, alta y edición con mensaje por defecto', async () => {
    const store = setup();
    vi.mocked(repo.list).mockReturnValue(throwError(() => new Error('')));
    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo cargar el catálogo.'));

    vi.mocked(repo.create).mockReturnValue(throwError(() => new Error('')));
    store.create({ sku: 'SKU-1', name: 'X', basePrice: '1.00', stock: 1 });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo crear el producto.'));

    vi.mocked(repo.update).mockReturnValue(throwError(() => new Error('')));
    store.update({ id: 'p-1', data: { stock: 1 } });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar el producto.'));
  });

  it('debe reconocer el guardado, limpiar el error y reiniciar', async () => {
    const store = setup();
    store.create({ sku: 'SKU-1', name: 'Teclado', basePrice: '100.00', stock: 5 });
    await vi.waitFor(() => expect(store.lastSaved()).toEqual(product));

    store.acknowledgeSaved();
    expect(store.lastSaved()).toBeNull();

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.products()).toEqual([]);
    expect(store.query()).toBe('');
  });
});
