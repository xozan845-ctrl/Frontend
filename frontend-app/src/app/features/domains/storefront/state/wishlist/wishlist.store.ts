import { computed, effect, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { ReviewsStore } from '../reviews/reviews.store';
import type { Product } from '../../models/product.model';
import { LOCAL_STATE } from '../../repositories/local-state.repository';
import type { WishlistState } from './wishlist.state';

export const WishlistStore = signalStore(
  { providedIn: 'root' },
  withState<WishlistState>({ items: [] }),
  withComputed(({ items }) => {
    const reviewsStore = inject(ReviewsStore);
    return {
      totalItems: () => items().length,
      itemIds: () => new Set(items().map((p) => p.id)),
      /** Producto + reseñas para la vista de favoritos (`R-ST-3`). */
      wishlistVms: computed(() =>
        items().map((product) => ({
          product,
          avgRating: reviewsStore.getAverageRating(product.id),
          reviewCount: reviewsStore.getReviewsByProductId(product.id).length,
        })),
      ),
    };
  }),
  withMethods((store) => ({
    toggle(product: Product): void {
      const items = store.items();
      const isIn = items.some((p) => String(p.id) === String(product.id));
      if (isIn) {
        patchState(store, { items: items.filter((p) => String(p.id) !== String(product.id)) });
      } else {
        patchState(store, { items: [...items, product] });
      }
    },
    isInWishlist(productId: string | number): boolean {
      return store.items().some((p) => String(p.id) === String(productId));
    },
    removeItem(productId: string | number): void {
      patchState(store, { items: store.items().filter((p) => String(p.id) !== String(productId)) });
    },
  })),
  withHooks({
    onInit(store, localState = inject(LOCAL_STATE)) {
      // La restauración llega validada por el límite de persistencia (R-ST-7).
      patchState(store, { items: localState.readWishlist().value });

      effect(() => {
        const items = store.items();
        if (items.length === 0) localState.clearWishlist();
        else localState.writeWishlist(items);
      });
    },
  }),
);
