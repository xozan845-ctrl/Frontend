import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { PRODUCT_CATEGORIES } from '../../constants/categories.constants';
import { ProductStore } from '../product/product.store';
import type { ProductSearchState } from './product-search.state';

/**
 * Buscador del storefront (`R-ST-3`, `R-ST-6`): el término es estado de UI
 * efímero y los resultados se derivan en `withComputed`. Se provee en el
 * componente para que no contamine el store global de productos.
 */
export const ProductSearchStore = signalStore(
  withState<ProductSearchState>({ term: '' }),
  withComputed(({ term }) => {
    const productStore = inject(ProductStore);

    return {
      matchedProducts: computed(() => {
        const value = term().toLowerCase().trim();
        if (value.length < 2) return [];
        return productStore
          .products()
          .filter(
            (product) =>
              product.name.toLowerCase().includes(value) ||
              product.description.toLowerCase().includes(value) ||
              product.category.toLowerCase().includes(value),
          )
          .slice(0, 6);
      }),
      matchedCategories: computed(() => {
        const value = term().toLowerCase().trim();
        if (value.length < 2) return [];
        const dynamicCategories = Array.from(
          new Set(
            productStore
              .products()
              .map((product) => product.category)
              .filter(Boolean),
          ),
        );
        const pool = dynamicCategories.length > 0 ? dynamicCategories : [...PRODUCT_CATEGORIES];
        return pool.filter((category) => category.toLowerCase().includes(value));
      }),
    };
  }),
  withMethods((store) => ({
    setTerm(term: string): void {
      patchState(store, { term });
    },
    clear(): void {
      patchState(store, { term: '' });
    },
  })),
);
