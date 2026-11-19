import { TestBed } from '@angular/core/testing';
import { WishlistStore } from './wishlist.store';
import { Product } from '../../models/product.model';
import { LOCAL_STATE } from '../../repositories/local-state.repository';
import { STORAGE_ENGINE } from '../../repositories/storage-engine.repository';
import { LocalStateService } from '../../services/local-state/local-state.service';
import { BrowserStorageService } from '../../services/local-state/browser-storage.service';

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
    TestBed.configureTestingModule({
      providers: [
        { provide: STORAGE_ENGINE, useClass: BrowserStorageService },
        { provide: LOCAL_STATE, useClass: LocalStateService },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it('debe iniciar vacío', () => {
    const store = TestBed.inject(WishlistStore);

    expect(store.items()).toEqual([]);
    expect(store.totalItems()).toBe(0);
  });

  // regression: F09 — un JSON válido con forma incorrecta no debe romper la restauración.
  it('debe iniciar vacío cuando el storage contiene un objeto JSON válido sin forma de arreglo', () => {
    localStorage.setItem('ecom_wishlist', JSON.stringify({}));

    const store = TestBed.inject(WishlistStore);

    expect(store.items()).toEqual([]);
    expect(() => store.totalItems()).not.toThrow();
  });

  // regression: F09 — los productos persistidos se validan uno a uno.
  it('debe descartar productos incompletos o inválidos al restaurar', () => {
    localStorage.setItem(
      'ecom_wishlist',
      JSON.stringify([null, {}, { id: 1 }, { ...product(2), price: '10' }, product(3)]),
    );

    const store = TestBed.inject(WishlistStore);

    expect(store.items()).toEqual([product(3)]);
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
      const stored: { version?: number; context?: string; items?: unknown[] } = JSON.parse(
        localStorage.getItem('ecom_wishlist') ?? '{}',
      );
      expect(stored.version).toBe(1);
      expect(stored.context).toBe('storefront');
      expect(stored.items).toHaveLength(1);
    });
  });
});
