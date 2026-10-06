import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductStore } from './product.store';
import { Product } from '../models/product.model';
import { PRODUCT_REPOSITORY, ProductRepository } from '../repositories/product.repository';

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
      getProducts: vi.fn(() => of(products)),
      getProductById: vi.fn((id: string | number) =>
        of(products.find((p) => String(p.id) === String(id)) ?? products[0]),
      ),
      getCategories: vi.fn(() => of(['Audio', 'Video'])),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_REPOSITORY, useValue: repo }],
    });
    return TestBed.inject(ProductStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe cargar los productos desde el repositorio', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);

    store.loadProducts();

    await vi.waitFor(() => expect(store.products()).toHaveLength(2));
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('debe derivar las categorías de los productos cargados', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(2));

    expect(store.categories()).toEqual(['All', 'Audio', 'Video']);
  });

  it('debe filtrar por categoría', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(2));

    store.setSelectedCategory('Audio');

    expect(store.filteredProducts().map((p) => p.id)).toEqual([1]);
  });

  it('debe filtrar por rango de precio', async () => {
    const store = setup([
      makeProduct(1, 'Audio', 50),
      makeProduct(2, 'Audio', 150),
      makeProduct(3, 'Audio', 300),
    ]);
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(3));

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
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(3));

    store.setSortOption('price-asc');
    expect(store.filteredProducts().map((p) => p.id)).toEqual([2, 3, 1]);

    store.setSortOption('price-desc');
    expect(store.filteredProducts().map((p) => p.id)).toEqual([1, 3, 2]);
  });

  it('debe paginar los productos y limitar la página al total', async () => {
    const products = Array.from({ length: 15 }, (_, index) => makeProduct(index + 1, 'Audio', 10));
    const store = setup(products);
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(15));

    expect(store.totalPages()).toBe(2);
    expect(store.paginatedProducts()).toHaveLength(12);

    store.setPage(999);
    expect(store.currentPage()).toBe(2);
  });

  it('debe limpiar los filtros y volver a la primera página', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);
    store.loadProducts();
    await vi.waitFor(() => expect(store.products()).toHaveLength(2));
    store.setSelectedCategory('Audio');
    store.setPriceMin(50);

    store.clearFilters();

    expect(store.selectedCategory()).toBe('All');
    expect(store.priceMin()).toBeNull();
    expect(store.currentPage()).toBe(1);
  });

  it('debe cargar y limpiar el producto seleccionado', async () => {
    const store = setup([makeProduct(1, 'Audio', 100), makeProduct(2, 'Video', 200)]);

    store.loadProductById(2);
    await vi.waitFor(() => expect(store.selectedProduct()?.id).toBe(2));

    store.clearSelectedProduct();
    expect(store.selectedProduct()).toBeNull();
  });
});
