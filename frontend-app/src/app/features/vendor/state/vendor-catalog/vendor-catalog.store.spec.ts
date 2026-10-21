import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VendorCatalogStore } from './vendor-catalog.store';
import {
  VENDOR_PRODUCT_REPOSITORY,
  VendorProductRepository,
} from '../../repositories/vendor-product.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { VendorProduct } from '../../models/vendor-order.model';

const product = (
  id: string,
  name: string,
  sku: string,
  category: string,
  inStock = true,
): VendorProduct => ({
  id,
  name,
  sku,
  category,
  price: 100,
  imageUrl: '',
  inStock,
});

const catalog: VendorProduct[] = [
  product('vp-1', 'Shampoo Keratina', 'KPBM-001', 'Cuidado capilar'),
  product('vp-2', 'Mascarilla Reparadora', 'SP-002', 'Cuidado capilar'),
  product('vp-3', 'Camelia Oil', 'CAM-003', 'Tratamientos'),
  product('vp-4', 'Acondicionador Ámbar', 'KPBM-004', 'Cuidado capilar', false),
];

describe('VendorCatalogStore', () => {
  let repo: VendorProductRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = { listVendorProducts: vi.fn(() => of(catalog)) };
    TestBed.configureTestingModule({
      providers: [
        VendorCatalogStore,
        { provide: VENDOR_PRODUCT_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(VendorCatalogStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar el catálogo y derivar categorías ordenadas', async () => {
    const store = setup();

    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(4));

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.categories()).toEqual(['Cuidado capilar', 'Tratamientos']);
    expect(store.filteredProducts()).toHaveLength(4);
  });

  it('debe exponer el error de la carga con aviso', async () => {
    const store = setup();
    vi.mocked(repo.listVendorProducts).mockReturnValue(throwError(() => new Error('boom')));

    store.loadProducts();
    await vi.waitFor(() => expect(store.error()).toBe('boom'));

    expect(store.loading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('boom');
  });

  it('debe usar el mensaje por defecto del catálogo', async () => {
    const store = setup();
    vi.mocked(repo.listVendorProducts).mockReturnValue(throwError(() => new Error('')));

    store.loadProducts();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar tus productos.'));
  });

  it('debe filtrar por término sin acentos y por categoría', async () => {
    const store = setup();
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(4));

    store.setQuery('ambar');
    expect(store.filteredProducts().map((item) => item.id)).toEqual(['vp-4']);

    store.setQuery('kpbm');
    expect(store.filteredProducts().map((item) => item.id)).toEqual(['vp-1', 'vp-4']);

    store.setQuery('');
    store.setCategory('Tratamientos');
    expect(store.filteredProducts().map((item) => item.id)).toEqual(['vp-3']);

    store.setQuery('shampoo');
    expect(store.filteredProducts()).toEqual([]);

    store.setCategory(null);
    expect(store.filteredProducts().map((item) => item.id)).toEqual(['vp-1']);
  });
});
