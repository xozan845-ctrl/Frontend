import { TestBed } from '@angular/core/testing';
import { RecentlyViewedStore } from './recently-viewed.store';
import { Product } from '../models/product.model';

const product = (id: number): Product => ({
  id,
  name: `Producto ${id}`,
  description: '',
  price: 10,
  imageUrl: '',
  category: 'General',
  stock: 1,
});

describe('RecentlyViewedStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('debe iniciar vacío', () => {
    const store = TestBed.inject(RecentlyViewedStore);

    expect(store.products()).toEqual([]);
  });

  it('debe agregar el producto más reciente al frente', () => {
    const store = TestBed.inject(RecentlyViewedStore);

    store.addProduct(product(1));
    store.addProduct(product(2));

    expect(store.products().map((p) => p.id)).toEqual([2, 1]);
  });

  it('debe evitar duplicados reubicando el producto al frente', () => {
    const store = TestBed.inject(RecentlyViewedStore);
    store.addProduct(product(1));
    store.addProduct(product(2));

    store.addProduct(product(1));

    expect(store.products().map((p) => p.id)).toEqual([1, 2]);
  });

  it('debe limitar la lista a 10 productos', () => {
    const store = TestBed.inject(RecentlyViewedStore);

    for (let id = 1; id <= 12; id++) {
      store.addProduct(product(id));
    }

    expect(store.products()).toHaveLength(10);
    expect(store.products()[0].id).toBe(12);
  });

  it('debe limpiar la lista', () => {
    const store = TestBed.inject(RecentlyViewedStore);
    store.addProduct(product(1));

    store.clear();

    expect(store.products()).toEqual([]);
  });
});
