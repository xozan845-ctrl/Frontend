import { TestBed } from '@angular/core/testing';
import { WishlistStore } from './wishlist.store';
import { Product } from '../../products/models/product.model';

const product = (id: number): Product => ({
  id,
  name: `Producto ${id}`,
  description: '',
  price: 10,
  imageUrl: '',
  category: 'General',
  stock: 1,
});

describe('WishlistStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('debe iniciar vacío', () => {
    const store = TestBed.inject(WishlistStore);

    expect(store.items()).toEqual([]);
    expect(store.totalItems()).toBe(0);
  });

  it('debe agregar un producto y exponer sus ids', () => {
    const store = TestBed.inject(WishlistStore);

    store.toggle(product(1));

    expect(store.totalItems()).toBe(1);
    expect(store.itemIds().has(1)).toBe(true);
    expect(store.isInWishlist(1)).toBe(true);
  });

  it('debe quitar el producto al alternarlo de nuevo', () => {
    const store = TestBed.inject(WishlistStore);
    store.toggle(product(1));

    store.toggle(product(1));

    expect(store.items()).toEqual([]);
    expect(store.isInWishlist(1)).toBe(false);
  });

  it('debe eliminar un producto por id', () => {
    const store = TestBed.inject(WishlistStore);
    store.toggle(product(1));
    store.toggle(product(2));

    store.removeItem(1);

    expect(store.items().map((item) => item.id)).toEqual([2]);
  });

  it('debe persistir en localStorage', async () => {
    const store = TestBed.inject(WishlistStore);

    store.toggle(product(1));

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('ecom_wishlist') ?? '[]');
      expect(stored).toHaveLength(1);
    });
  });
});
