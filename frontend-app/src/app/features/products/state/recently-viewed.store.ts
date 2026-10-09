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
          const parsed = JSON.parse(stored);
          // Solo se acepta un arreglo; cualquier otro shape se ignora (R-RB-4).
          if (Array.isArray(parsed)) patchState(store, { products: parsed as Product[] });
        }
      } catch {
        // JSON corrupto o storage no disponible: se arranca vacío (R-RB-4).
      }

      effect(() => {
        const products = store.products();
        try {
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(products));
        } catch {
          // Storage no disponible: se ignora.
        }
      });
    },
  }),
);
