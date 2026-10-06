import { effect } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { Product } from '../models/product.model';

export interface RecentlyViewedState {
  products: Product[];
}

const RECENTLY_VIEWED_KEY = 'ecom_recently_viewed';
const MAX_ITEMS = 10;

export const RecentlyViewedStore = signalStore(
  { providedIn: 'root' },
  withState<RecentlyViewedState>({ products: [] }),
  withMethods((store) => ({
    addProduct(product: Product): void {
      // Remove duplicate if exists (LRU: most recent first)
      const current = store.products().filter((p) => String(p.id) !== String(product.id));
      const updated = [product, ...current].slice(0, MAX_ITEMS);
      patchState(store, { products: updated });
    },
    clear(): void {
      patchState(store, { products: [] });
    },
  })),
  withHooks({
    onInit(store) {
      try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (stored) {
          patchState(store, { products: JSON.parse(stored) as Product[] });
        }
      } catch (e) {
        console.error('Failed to load recently viewed from localStorage', e);
      }

      effect(() => {
        const products = store.products();
        try {
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(products));
        } catch (e) {
          console.error('Failed to save recently viewed to localStorage', e);
        }
      });
    },
  }),
);
