import { TestBed } from '@angular/core/testing';
import { LOCAL_STATE_KEYS, LOCAL_STATE_MESSAGES } from '../../constants/local-state.constants';
import type { CartItem } from '../../models/cart.model';
import type { Product } from '../../models/product.model';
import type { Review } from '../../models/review.model';
import { LOCAL_STATE, LocalStatePort } from '../../repositories/local-state.repository';
import { STORAGE_ENGINE, StorageEngine } from '../../repositories/storage-engine.repository';
import { BrowserStorageService } from './browser-storage.service';
import { LocalStateService } from './local-state.service';
import { MemoryStorageService } from './memory-storage.service';

const product = (id: string | number): Product => ({
  id,
  name: `Producto ${id}`,
  description: '',
  price: 100,
  imageUrl: '',
  category: 'General',
  stock: 10,
});

const cartItem = (id: string | number, quantity = 1): CartItem => ({
  product: product(id),
  quantity,
});

const review = (id: string): Review => ({
  id,
  productId: 1,
  authorName: 'Ana',
  rating: 5,
  comment: 'Excelente',
  date: '2026-01-02T10:00:00Z',
});

const engines: [string, () => StorageEngine][] = [
  ['navegador', () => new BrowserStorageService()],
  ['memoria', () => new MemoryStorageService()],
];

class UnavailableStorage implements StorageEngine {
  get(): never {
    throw new Error('storage bloqueado');
  }

  set(): never {
    throw new Error('storage bloqueado');
  }

  remove(): never {
    throw new Error('storage bloqueado');
  }
}

function configure(engine: StorageEngine): LocalStatePort {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: STORAGE_ENGINE, useValue: engine },
      { provide: LOCAL_STATE, useClass: LocalStateService },
    ],
  });
  return TestBed.inject(LOCAL_STATE);
}

describe('LocalStateService', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it.each(engines)(
    'debe devolver valores válidos y un resultado vacío sin datos con el adaptador de %s',
    (_name, createEngine) => {
      const port = configure(createEngine());

      expect(port.readCart()).toEqual({
        value: [],
        restored: false,
        recovered: false,
        discarded: 0,
        reason: null,
        message: null,
      });
    },
  );

  it.each(engines)(
    'debe conservar el carrito al escribir y leer con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      const port = configure(engine);

      port.writeCart([cartItem(1, 2)]);

      expect(port.readCart()).toMatchObject({
        value: [cartItem(1, 2)],
        restored: true,
        recovered: false,
        discarded: 0,
        reason: null,
        message: null,
      });
      const stored = JSON.parse(engine.get(LOCAL_STATE_KEYS.cart) ?? '{}');
      expect(stored.version).toBe(1);
      expect(stored.context).toBe('storefront');
    },
  );

  it.each(engines)(
    'debe conservar wishlist y reseñas al escribir y leer con el adaptador de %s',
    (_name, createEngine) => {
      const port = configure(createEngine());

      port.writeWishlist([product(3)]);
      port.writeReviews([review('r-1')]);

      expect(port.readWishlist().value).toEqual([product(3)]);
      expect(port.readReviews().value).toEqual([review('r-1')]);
    },
  );

  it.each(engines)(
    'debe recuperar el mismo mensaje ante JSON inválido con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      engine.set(LOCAL_STATE_KEYS.cart, '{no-es-json');
      const port = configure(engine);

      const result = port.readCart();

      expect(result.value).toEqual([]);
      expect(result.recovered).toBe(true);
      expect(result.reason).toBe('invalid-json');
      expect(result.message).toBe(LOCAL_STATE_MESSAGES['invalid-json']);
    },
  );

  it.each(engines)(
    'debe ignorar un objeto vacío sin lanzar excepciones con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      engine.set(LOCAL_STATE_KEYS.cart, JSON.stringify({}));
      const port = configure(engine);

      const result = port.readCart();

      expect(result.value).toEqual([]);
      expect(result.reason).toBe('invalid-shape');
      expect(result.message).toBe(LOCAL_STATE_MESSAGES['invalid-shape']);
    },
  );

  it.each(engines)(
    'debe ignorar null cuando el JSON no tiene forma de colección con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      engine.set(LOCAL_STATE_KEYS.wishlist, 'null');
      const port = configure(engine);

      expect(port.readWishlist()).toMatchObject({
        value: [],
        reason: 'invalid-shape',
        message: LOCAL_STATE_MESSAGES['invalid-shape'],
      });
    },
  );

  it.each(engines)(
    'debe descartar entradas y cantidades inválidas sin lanzar con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      engine.set(
        LOCAL_STATE_KEYS.cart,
        JSON.stringify([
          null,
          { product: product(1), quantity: -1 },
          { product: product(2), quantity: '2' },
          { product: { id: 3 }, quantity: 1 },
          cartItem(4, 2),
        ]),
      );
      const port = configure(engine);

      const result = port.readCart();

      expect(result.value).toEqual([cartItem(4, 2)]);
      expect(result.recovered).toBe(true);
      expect(result.discarded).toBe(4);
      expect(result.reason).toBe('partially-discarded');
      expect(result.message).toBe(LOCAL_STATE_MESSAGES['partially-discarded']);
    },
  );

  it.each(engines)(
    'debe rechazar una versión no compatible con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      engine.set(
        LOCAL_STATE_KEYS.cart,
        JSON.stringify({ version: 2, context: 'storefront', items: [cartItem(1)] }),
      );
      const port = configure(engine);

      expect(port.readCart()).toMatchObject({
        value: [],
        recovered: true,
        reason: 'unsupported-version',
        message: LOCAL_STATE_MESSAGES['unsupported-version'],
      });
    },
  );

  it.each(engines)(
    'debe ignorar datos de otro contexto con el adaptador de %s',
    (_name, createEngine) => {
      const engine = createEngine();
      engine.set(
        LOCAL_STATE_KEYS.cart,
        JSON.stringify({ version: 1, context: 'admin', items: [cartItem(99)] }),
      );
      const port = configure(engine);

      const result = port.readCart();

      expect(result.value).toEqual([]);
      expect(result.value).not.toContainEqual(cartItem(99));
      expect(result.reason).toBe('foreign-context');
      expect(result.message).toBe(LOCAL_STATE_MESSAGES['foreign-context']);
    },
  );

  it('debe informar storage no disponible y no lanzar al escribir o limpiar', () => {
    const port = configure(new UnavailableStorage());

    const result = port.readCart();

    expect(result).toMatchObject({
      value: [],
      restored: false,
      recovered: true,
      reason: 'storage-unavailable',
      message: LOCAL_STATE_MESSAGES['storage-unavailable'],
    });
    expect(() => port.writeCart([cartItem(1)])).not.toThrow();
    expect(() => port.writeWishlist([product(1)])).not.toThrow();
    expect(() => port.writeReviews([review('r-1')])).not.toThrow();
    expect(() => port.clearCart()).not.toThrow();
    expect(() => port.clearWishlist()).not.toThrow();
    expect(() => port.clearReviews()).not.toThrow();
  });

  it('debe limpiar la clave cuando la colección escrita queda vacía', () => {
    const engine = new MemoryStorageService();
    const port = configure(engine);

    port.writeCart([cartItem(1)]);
    expect(engine.get(LOCAL_STATE_KEYS.cart)).not.toBeNull();

    port.writeCart([]);
    expect(engine.get(LOCAL_STATE_KEYS.cart)).toBeNull();
  });

  it('debe limpiar wishlist y reseñas con las operaciones del puerto', () => {
    const engine = new MemoryStorageService();
    const port = configure(engine);

    port.writeWishlist([product(1)]);
    port.writeReviews([review('r-1')]);
    port.clearWishlist();
    port.clearReviews();

    expect(engine.get(LOCAL_STATE_KEYS.wishlist)).toBeNull();
    expect(engine.get(LOCAL_STATE_KEYS.reviews)).toBeNull();
  });
});
