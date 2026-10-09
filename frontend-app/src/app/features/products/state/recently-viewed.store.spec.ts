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

  it('debe restaurar los productos vistos desde localStorage', () => {
    localStorage.setItem('ecom_recently_viewed', JSON.stringify([product(7)]));

    const store = TestBed.inject(RecentlyViewedStore);

    expect(store.products().map((p) => p.id)).toEqual([7]);
  });

  it('debe persistir los productos vistos en localStorage', async () => {
    const store = TestBed.inject(RecentlyViewedStore);

    store.addProduct(product(3));

    await vi.waitFor(() =>
      expect(JSON.parse(localStorage.getItem('ecom_recently_viewed') ?? '[]')).toHaveLength(1),
    );
  });

  it('debe ignorar un localStorage con JSON corrupto', () => {
    localStorage.setItem('ecom_recently_viewed', '{no-json');

    const store = TestBed.inject(RecentlyViewedStore);

    expect(store.products()).toEqual([]);
  });

  it('debe ignorar un localStorage que no es un arreglo', () => {
    localStorage.setItem('ecom_recently_viewed', '{"no":"array"}');

    const store = TestBed.inject(RecentlyViewedStore);

    expect(store.products()).toEqual([]);
  });
});
