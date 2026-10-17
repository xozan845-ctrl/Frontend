import { TestBed } from '@angular/core/testing';
import { ReviewsStore } from './reviews.store';
import { Review } from '../models/review.model';

/** Reseñas controladas del spec: producto 1 con 5 y 4 estrellas (promedio 4.5). */
const RESENAS: Review[] = [
  {
    id: 'r-1',
    productId: 1,
    authorName: 'Ana',
    rating: 5,
    comment: 'Excelente',
    date: '2026-01-02T10:00:00Z',
  },
  {
    id: 'r-2',
    productId: 1,
    authorName: 'Luis',
    rating: 4,
    comment: 'Muy bueno',
    date: '2026-01-03T10:00:00Z',
  },
];

describe('ReviewsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('debe iniciar sin reseñas cuando no hay nada guardado', () => {
    const store = TestBed.inject(ReviewsStore);

    expect(store.reviews()).toEqual([]);
  });

  it('debe obtener las reseñas de un producto', () => {
    localStorage.setItem('ecom_reviews', JSON.stringify(RESENAS));
    const store = TestBed.inject(ReviewsStore);

    const reviews = store.getReviewsByProductId(1);

    expect(reviews).toHaveLength(2);
    expect(reviews.every((review) => String(review.productId) === '1')).toBe(true);
  });

  it('debe devolver cero de promedio cuando no hay reseñas', () => {
    const store = TestBed.inject(ReviewsStore);

    expect(store.getAverageRating(99999)).toBe(0);
  });

  it('debe calcular el promedio redondeado a un decimal', () => {
    localStorage.setItem('ecom_reviews', JSON.stringify(RESENAS));
    const store = TestBed.inject(ReviewsStore);

    expect(store.getAverageRating(1)).toBe(4.5);
  });

  it('debe agregar una reseña con id y fecha autogenerados', () => {
    const store = TestBed.inject(ReviewsStore);

    store.addReview({ productId: 2, authorName: 'Ana', rating: 4, comment: 'Muy bueno' });

    expect(store.reviews()).toHaveLength(1);
    const added = store.reviews().at(-1)!;
    expect(added.authorName).toBe('Ana');
    expect(added.id).toMatch(/^r-/);
    expect(() => new Date(added.date).toISOString()).not.toThrow();
  });

  it('debe restaurar las reseñas guardadas en localStorage', () => {
    localStorage.setItem('ecom_reviews', JSON.stringify(RESENAS));

    const store = TestBed.inject(ReviewsStore);

    expect(store.reviews()).toEqual(RESENAS);
  });

  it('debe persistir las reseñas en localStorage', async () => {
    const store = TestBed.inject(ReviewsStore);

    store.addReview({ productId: 3, authorName: 'Luis', rating: 5, comment: 'Excelente' });

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('ecom_reviews') ?? '[]');
      expect(stored.some((r: { authorName: string }) => r.authorName === 'Luis')).toBe(true);
    });
  });

  it('debe iniciar sin reseñas cuando el localStorage está corrupto', () => {
    localStorage.setItem('ecom_reviews', '{no-json');

    const store = TestBed.inject(ReviewsStore);

    expect(store.reviews()).toEqual([]);
  });

  it('debe iniciar sin reseñas cuando el localStorage no es un arreglo', () => {
    localStorage.setItem('ecom_reviews', '{"no":"array"}');

    const store = TestBed.inject(ReviewsStore);

    expect(store.reviews()).toEqual([]);
  });
});
