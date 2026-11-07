import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { VENDOR_PRODUCT_REPOSITORY } from '../../repositories/vendor-product.repository';
import type { VendorCatalogState } from '../vendor.state';

const initialState: VendorCatalogState = {
  products: [],
  loading: false,
  error: null,
  query: '',
  category: null,
};

/** Minúsculas sin acentos para que el buscador del POS sea tolerante. */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Catálogo propio del vendedor para el POS: carga por el puerto (`R-ST-5`) y
 * filtros derivados en `withComputed` (`R-ST-2`). Store de feature (no `root`).
 */
export const VendorCatalogStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const categories = computed(() =>
      [...new Set(store.products().map((product) => product.category))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    );
    const filteredProducts = computed(() => {
      const needle = normalizeText(store.query());
      const category = store.category();
      return store
        .products()
        .filter(
          (product) =>
            (!category || product.category === category) &&
            (!needle ||
              [product.name, product.sku].some((field) => normalizeText(field).includes(needle))),
        );
    });

    return { categories, filteredProducts };
  }),
  withMethods(
    (
      store,
      productRepo = inject(VENDOR_PRODUCT_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      /** Carga visible del catálogo; avisa si falla. */
      loadProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            productRepo.listVendorProducts().pipe(
              tap((products) => patchState(store, { products, loading: false })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar tus productos.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      /** Cambia el término del buscador. */
      setQuery(query: string): void {
        patchState(store, { query });
      },

      /** Activa una categoría (`null` = todas). */
      setCategory(category: string | null): void {
        patchState(store, { category });
      },
    }),
  ),
);
