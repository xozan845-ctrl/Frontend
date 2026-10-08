import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductStore } from './product.store';
import { Product } from '../models/product.model';
import { PRODUCT_REPOSITORY, ProductRepository } from '../repositories/product.repository';
import { MOCK_STORE } from '../mocks/product.mock';

const makeProduct = (id: number, category: string, price: number): Product => ({
  id,
  name: `Producto ${id}`,
  description: '',
  price,
  imageUrl: '',
  category,
  stock: 10,
});

describe('ProductStore', () => {
  let repo: ProductRepository;

  const setup = (products: Product[]) => {
    repo = {
      getStorefront: vi.fn(() => of({ store: MOCK_STORE, products })),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_REPOSITORY, useValue: repo }],
    });
    return TestBed.inject(ProductStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe cargar la tienda y sus ofertas desde el repositorio', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);

    await store.loadStore('tienda-1');

    expect(store.products()).toHaveLength(2);
    expect(store.store()).toEqual(MOCK_STORE);
    expect(store.storeId()).toBe('tienda-1');
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('debe derivar las categorías de los productos cargados', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    await store.loadStore('tienda-1');

    expect(store.categories()).toEqual(['All', 'Audio', 'Video']);
  });

  it('debe filtrar por categoría', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    await store.loadStore('tienda-1');

    store.setSelectedCategory('Audio');

    expect(store.filteredProducts().map((p) => p.id)).toEqual([1]);
  });

  it('debe filtrar por rango de precio', async () => {
    const store = setup([
      makeProduct(1, 'Audio', 50),
      makeProduct(2, 'Audio', 150),
      makeProduct(3, 'Audio', 300),
    ]);
    await store.loadStore('tienda-1');

    store.setPriceMin(100);
    store.setPriceMax(200);

    expect(store.filteredProducts().map((p) => p.id)).toEqual([2]);
  });

  it('debe ordenar por precio ascendente y descendente', async () => {
    const store = setup([
      makeProduct(1, 'Audio', 300),
      makeProduct(2, 'Audio', 100),
      makeProduct(3, 'Audio', 200),
    ]);
    await store.loadStore('tienda-1');

    store.setSortOption('price-asc');
    expect(store.filteredProducts().map((p) => p.id)).toEqual([2, 3, 1]);

    store.setSortOption('price-desc');
    expect(store.filteredProducts().map((p) => p.id)).toEqual([1, 3, 2]);
  });

  it('debe ordenar por nombre ascendente y descendente', async () => {
    const products: Product[] = [
      { ...makeProduct(1, 'Audio', 100), name: 'Zeta' },
      { ...makeProduct(2, 'Audio', 100), name: 'Alfa' },
      { ...makeProduct(3, 'Audio', 100), name: 'Mono' },
    ];
    const store = setup(products);
    await store.loadStore('tienda-1');

    store.setSortOption('name-asc');
    expect(store.filteredProducts().map((p) => p.name)).toEqual(['Alfa', 'Mono', 'Zeta']);

    store.setSortOption('name-desc');
    expect(store.filteredProducts().map((p) => p.name)).toEqual(['Zeta', 'Mono', 'Alfa']);
  });

  it('debe paginar los productos y limitar la página al total', async () => {
    const products = Array.from({ length: 15 }, (_, index) => makeProduct(index + 1, 'Audio', 10));
    const store = setup(products);
    await store.loadStore('tienda-1');

    expect(store.totalPages()).toBe(2);
    expect(store.paginatedProducts()).toHaveLength(12);

    store.setPage(999);
    expect(store.currentPage()).toBe(2);
  });

  it('debe limpiar los filtros y volver a la primera página', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    await store.loadStore('tienda-1');
    store.setSelectedCategory('Audio');
    store.setPriceMin(50);

    store.clearFilters();

    expect(store.selectedCategory()).toBe('All');
    expect(store.priceMin()).toBeNull();
    expect(store.currentPage()).toBe(1);
  });

  it('debe seleccionar y limpiar el producto del storefront cargado', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    await store.loadStore('tienda-1');

    store.selectProduct(2);
    expect(store.selectedProduct()?.id).toBe(2);

    store.clearSelectedProduct();
    expect(store.selectedProduct()).toBeNull();
  });

  // regression: R-RB-3 — un error de API no debe dejar el store inutilizable.
  it('debe permitir recargar el storefront tras un error', async () => {
    let shouldFail = true;
    const products = [makeProduct(1, 'Audio', 100)];
    repo = {
      getStorefront: vi.fn(() =>
        shouldFail ? throwError(() => new Error('boom')) : of({ store: MOCK_STORE, products }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(ProductStore);

    await store.loadStore('tienda-1');
    expect(store.error()).toBe('boom');

    shouldFail = false;
    await store.reload();
    expect(store.products()).toHaveLength(1);
    expect(store.error()).toBeNull();
  });
});
