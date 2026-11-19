import { inject, effect } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { Review } from '../../models/review.model';
import { NotificationService } from '@core/services/notification/notification.service';
import { LOCAL_STATE } from '../../repositories/local-state.repository';
import type { ReviewsState } from '../product/product.state';

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
    onInit(store, localState = inject(LOCAL_STATE)) {
      // La restauración llega validada por el límite de persistencia (R-ST-7).
      patchState(store, { reviews: localState.readReviews().value });

      effect(() => {
        const reviews = store.reviews();
        if (reviews.length === 0) localState.clearReviews();
        else localState.writeReviews(reviews);
      });
    },
  }),
);
