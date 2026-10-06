import { TestBed } from '@angular/core/testing';
import { ReviewsStore } from './reviews.store';
import { MOCK_REVIEWS } from '../mocks/reviews.mock';

describe('ReviewsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('debe cargar las reseñas de ejemplo cuando no hay nada guardado', () => {
    const store = TestBed.inject(ReviewsStore);

    expect(store.reviews()).toEqual(MOCK_REVIEWS);
  });

  it('debe obtener las reseñas de un producto', () => {
    const store = TestBed.inject(ReviewsStore);

    const reviews = store.getReviewsByProductId(1);

    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every((review) => String(review.productId) === '1')).toBe(true);
  });

  it('debe devolver cero de promedio cuando no hay reseñas', () => {
    const store = TestBed.inject(ReviewsStore);

    expect(store.getAverageRating(99999)).toBe(0);
  });

  it('debe calcular el promedio redondeado a un decimal', () => {
    const store = TestBed.inject(ReviewsStore);

    const average = store.getAverageRating(1);

    expect(average).toBeGreaterThan(0);
    expect(average).toBeLessThanOrEqual(5);
  });

  it('debe agregar una reseña con id y fecha autogenerados', () => {
    const store = TestBed.inject(ReviewsStore);
    const before = store.reviews().length;

    store.addReview({ productId: 2, authorName: 'Ana', rating: 4, comment: 'Muy bueno' });

    expect(store.reviews()).toHaveLength(before + 1);
    const added = store.reviews().at(-1)!;
    expect(added.authorName).toBe('Ana');
    expect(added.id).toMatch(/^r-/);
    expect(() => new Date(added.date).toISOString()).not.toThrow();
  });
});
