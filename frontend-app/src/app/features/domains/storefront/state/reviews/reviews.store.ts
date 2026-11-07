import { inject, effect } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { Review } from '../../models/review.model';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import type { ReviewsState } from '../product/product.state';

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
      // Las reseñas viven solo en localStorage; sin datos guardados, arranca vacío.
      try {
        const stored = localStorage.getItem(REVIEWS_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        // Solo se acepta un arreglo no vacío (R-RB-4).
        patchState(store, {
          reviews: Array.isArray(parsed) && parsed.length > 0 ? parsed : [],
        });
      } catch {
        // JSON corrupto o storage no disponible: se arranca sin reseñas (R-RB-4).
        patchState(store, { reviews: [] });
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
