import { inject, effect } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { Review } from '../models/review.model';
import { NotificationService } from '../../../core/services/notification.service';
import { MOCK_REVIEWS } from '../mocks/reviews.mock';

export interface ReviewsState {
  reviews: Review[];
}

const REVIEWS_KEY = 'ecom_reviews';

export const ReviewsStore = signalStore(
  { providedIn: 'root' },
  withState<ReviewsState>({ reviews: [] }),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    getReviewsByProductId(productId: string | number): Review[] {
      return store.reviews().filter((r) => String(r.productId) === String(productId));
    },
    getAverageRating(productId: string | number): number {
      const productReviews = store
        .reviews()
        .filter((r) => String(r.productId) === String(productId));
      if (productReviews.length === 0) return 0;
      const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
      return Math.round((sum / productReviews.length) * 10) / 10;
    },
    addReview(review: Omit<Review, 'id' | 'date'>): void {
      const newReview: Review = {
        ...review,
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString(),
      };
      patchState(store, { reviews: [...store.reviews(), newReview] });
      notificationService.showSuccess('¡Reseña publicada exitosamente!');
    },
  })),
  withHooks({
    onInit(store) {
      // Load reviews from localStorage on startup, fallback to mock reviews
      try {
        const stored = localStorage.getItem(REVIEWS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Solo se acepta un arreglo no vacío (R-RB-4).
          patchState(store, {
            reviews: Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_REVIEWS,
          });
        } else {
          patchState(store, { reviews: MOCK_REVIEWS });
        }
      } catch {
        // JSON corrupto o storage no disponible: se usan las de ejemplo (R-RB-4).
        patchState(store, { reviews: MOCK_REVIEWS });
      }

      // Sync reviews to localStorage
      effect(() => {
        const reviews = store.reviews();
        try {
          localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
        } catch {
          // Storage no disponible: se ignora.
        }
      });
    },
  }),
);
