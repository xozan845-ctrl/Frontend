import { computed, effect, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { ReviewsStore } from '../../../products/public-api';
import type { Product } from '../../../products/public-api';
import type { WishlistState } from './wishlist.state';

const WISHLIST_KEY = 'ecom_wishlist';

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
    onInit(store) {
      try {
        const stored = localStorage.getItem(WISHLIST_KEY);
        if (stored) {
          patchState(store, { items: JSON.parse(stored) as Product[] });
        }
      } catch (e) {
        console.error('Failed to load wishlist from localStorage', e);
      }

      effect(() => {
        const items = store.items();
        try {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
        } catch (e) {
          console.error('Failed to save wishlist to localStorage', e);
        }
      });
    },
  }),
);
