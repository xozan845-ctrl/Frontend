import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Product } from '../../models/product.model';
import { ProductStore } from '../product/product.store';
import { ProductSearchStore } from './product-search.store';

const products: Product[] = [
  {
    id: 1,
    name: 'Teclado Mecánico',
    description: 'Teclas RGB',
    price: 100,
    imageUrl: '/teclado.jpg',
    category: 'Periféricos',
    stock: 5,
  },
  {
    id: 2,
    name: 'Monitor Gamer',
    description: 'Monitor 4K',
    price: 500,
    imageUrl: '/monitor.jpg',
    category: 'Monitores',
    stock: 3,
  },
];

describe('ProductSearchStore', () => {
  const productStore = { products: signal(products) };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [ProductSearchStore, { provide: ProductStore, useValue: productStore }],
    });
    return TestBed.inject(ProductSearchStore);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('arranca sin término y sin resultados', () => {
    const store = setup();

    expect(store.term()).toBe('');
    expect(store.matchedProducts()).toEqual([]);
    expect(store.matchedCategories()).toEqual([]);
  });

  it('filtra productos y categorías al escribir', () => {
    const store = setup();

    store.setTerm('mon');

    expect(store.matchedProducts().map((item) => item.id)).toEqual([2]);
    expect(store.matchedCategories()).toEqual(['Monitores']);
  });

  it('encuentra por descripción o categoría y devuelve vacío sin coincidencias', () => {
    const store = setup();

    store.setTerm('rgb');
    expect(store.matchedProducts().map((item) => item.id)).toEqual([1]);

    store.setTerm('monitores');
    expect(store.matchedProducts().map((item) => item.id)).toEqual([2]);

    store.setTerm('zzz');
    expect(store.matchedProducts()).toEqual([]);
  });

  it('usa las categorías por defecto si el catálogo está vacío', () => {
    productStore.products.set([]);
    const store = setup();

    store.setTerm('lap');

    expect(store.matchedCategories()).toEqual(['Laptops']);
    productStore.products.set(products);
  });

  it('limpia el término y los resultados', () => {
    const store = setup();
    store.setTerm('tec');

    store.clear();

    expect(store.term()).toBe('');
    expect(store.matchedProducts()).toEqual([]);
  });
});
