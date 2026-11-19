import type { CartItem } from '../../models/cart.model';
import type { Product } from '../../models/product.model';
import type { Review } from '../../models/review.model';
import {
  normalizePersistedCart,
  normalizePersistedCartItem,
  normalizePersistedProduct,
  normalizePersistedReview,
  normalizePersistedReviews,
  normalizePersistedWishlist,
} from './local-state.adapter';

const product = (id: string | number, overrides: Partial<Product> = {}): Product => ({
  id,
  name: `Producto ${id}`,
  description: '',
  price: 100,
  imageUrl: '',
  category: 'General',
  stock: 10,
  ...overrides,
});

const cartItem = (id: string | number, quantity = 1): CartItem => ({
  product: product(id),
  quantity,
});

const review = (id: string, overrides: Partial<Review> = {}): Review => ({
  id,
  productId: 1,
  authorName: 'Ana',
  rating: 5,
  comment: 'Excelente',
  date: '2026-01-02T10:00:00Z',
  ...overrides,
});

describe('local-state.adapter', () => {
  it('debe rechazar un objeto vacío cuando no es envelope ni arreglo', () => {
    const result = normalizePersistedCart({});

    expect(result).toEqual({ ok: false, reason: 'invalid-shape' });
  });

  it('debe rechazar null cuando no es una colección', () => {
    expect(normalizePersistedWishlist(null)).toEqual({ ok: false, reason: 'invalid-shape' });
  });

  it('debe aceptar el formato legado en arreglo cuando las líneas son válidas', () => {
    const result = normalizePersistedCart([cartItem(1)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.legacy).toBe(true);
    expect(result.items).toEqual([cartItem(1)]);
    expect(result.discarded).toBe(0);
  });

  it('debe descartar entradas nulas cuando el arreglo contiene null', () => {
    const result = normalizePersistedCart([null, cartItem(1)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([cartItem(1)]);
    expect(result.discarded).toBe(1);
  });

  it.each([-1, 0, '2', 1.5, 1000, Number.NaN, Number.POSITIVE_INFINITY])(
    'debe descartar la cantidad %s cuando no es un entero positivo dentro del límite',
    (quantity) => {
      const result = normalizePersistedCart([
        { product: product(1), quantity } as unknown as CartItem,
        cartItem(2),
      ]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.items).toEqual([cartItem(2)]);
      expect(result.discarded).toBe(1);
    },
  );

  it('debe descartar un producto incompleto cuando falta un campo obligatorio', () => {
    const result = normalizePersistedCart([
      { product: { id: 1 }, quantity: 1 } as unknown as CartItem,
      cartItem(2),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([cartItem(2)]);
    expect(result.discarded).toBe(1);
  });

  it('debe conservar precio y stock cero cuando son valores válidos', () => {
    const result = normalizePersistedProduct(product(1, { price: 0, stock: 0 }));

    expect(result).toEqual(product(1, { price: 0, stock: 0 }));
  });

  it('debe deduplicar líneas cuando repiten el id del producto', () => {
    const result = normalizePersistedCart([cartItem(1), cartItem(1, 2)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([cartItem(1)]);
    expect(result.discarded).toBe(1);
  });

  it('debe respetar el límite de líneas del carrito', () => {
    const items = Array.from({ length: 101 }, (_, index) => cartItem(index));

    const result = normalizePersistedCart(items);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(100);
    expect(result.discarded).toBe(1);
  });

  it('debe rechazar una versión distinta cuando el envelope no coincide', () => {
    const result = normalizePersistedCart({
      version: 2,
      context: 'storefront',
      items: [],
    });

    expect(result).toEqual({ ok: false, reason: 'unsupported-version' });
  });

  it('debe rechazar un contexto ajeno cuando el envelope viene de otro contexto', () => {
    const result = normalizePersistedCart({
      version: 1,
      context: 'admin',
      items: [],
    });

    expect(result).toEqual({ ok: false, reason: 'foreign-context' });
  });

  it('debe rechazar un envelope sin items cuando la forma es inválida', () => {
    const result = normalizePersistedCart({ version: 1, context: 'storefront' });

    expect(result).toEqual({ ok: false, reason: 'invalid-shape' });
  });

  it('debe normalizar imágenes y variantes cuando son válidas', () => {
    const result = normalizePersistedProduct({
      ...product(1),
      images: ['https://a.test/1.png', 2, 'https://a.test/2.png'],
      variants: {
        colors: [{ name: 'Rojo', hex: '#f00' }, { name: 'Inválido' }],
        specs: ['Talla M', 3],
      },
    });

    expect(result?.images).toEqual(['https://a.test/1.png', 'https://a.test/2.png']);
    expect(result?.variants).toEqual({
      colors: [{ name: 'Rojo', hex: '#f00' }],
      specs: ['Talla M'],
    });
  });

  it('debe descartar productos inválidos de la wishlist cuando hay mezcla', () => {
    const result = normalizePersistedWishlist([null, { id: 1 }, product(2)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([product(2)]);
    expect(result.discarded).toBe(2);
  });

  it('debe descartar reseñas con rating o fecha inválidos cuando se restauran', () => {
    const result = normalizePersistedReviews([
      review('r-malo', { rating: 9 }),
      review('r-fecha', { date: 'no-es-fecha' }),
      review('r-bien'),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([review('r-bien')]);
    expect(result.discarded).toBe(2);
  });

  it('debe respetar el límite de reseñas cuando hay más de las permitidas', () => {
    const reviews = Array.from({ length: 501 }, (_, index) => review(`r-${index}`));

    const result = normalizePersistedReviews(reviews);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(500);
    expect(result.discarded).toBe(1);
  });

  it('debe descartar una línea con cantidad válida cuando el producto no cumple el modelo', () => {
    expect(normalizePersistedCartItem({ product: { id: 1 }, quantity: 1 })).toBeNull();
  });

  it('debe descartar una reseña cuando el rating no es entero', () => {
    expect(normalizePersistedReview(review('r-1', { rating: 4.5 }))).toBeNull();
  });
});
