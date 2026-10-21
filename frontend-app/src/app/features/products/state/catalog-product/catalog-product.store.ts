import { inject, untracked } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import {
  CatalogProductFilters,
  CatalogProductStatus,
  CreateCatalogProductData,
  UpdateCatalogProductData,
} from '../../models/catalog-product.model';
import { CATALOG_PRODUCT_REPOSITORY } from '../../repositories/catalog-product.repository';
import type { CatalogProductsState } from './catalog-product.state';

const initialState: CatalogProductsState = {
  products: [],
  total: 0,
  page: 1,
  limit: 20,
  pages: 1,
  query: '',
  status: null,
  category: '',
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
};

/**
 * Catálogo maestro (ADR-32): listado público con filtros/paginación y CRUD del
 * empresario. Store de feature provisto en la ruta del panel.
 */
export const CatalogProductsStore = signalStore(
  withState(initialState),
  withComputed(({ page, pages, products }) => ({
    isFirstPage: () => page() <= 1,
    isLastPage: () => page() >= pages(),
    hasProducts: () => products().length > 0,
  })),
  withMethods(
    (
      store,
      repo = inject(CATALOG_PRODUCT_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const currentFilters = (): CatalogProductFilters => ({
        q: untracked(() => store.query()),
        status: untracked(() => store.status()) ?? undefined,
        category: untracked(() => store.category()),
        page: untracked(() => store.page()),
        limit: untracked(() => store.limit()),
      });

      const load = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            repo.list(currentFilters()).pipe(
              tap((result) =>
                patchState(store, {
                  products: result.items,
                  total: result.total,
                  page: result.page,
                  limit: result.limit,
                  pages: result.pages,
                  loading: false,
                  error: null,
                }),
              ),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el catálogo.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        /** Carga la página/filtros actuales. */
        load,

        /** Aplica el término de búsqueda y vuelve a la página 1. */
        setQuery(query: string): void {
          patchState(store, { query, page: 1 });
          load();
        },

        /** Filtra por estado (`null` = todos) y vuelve a la página 1. */
        setStatus(status: CatalogProductStatus | null): void {
          patchState(store, { status, page: 1 });
          load();
        },

        /** Filtra por categoría (texto libre) y vuelve a la página 1. */
        setCategory(category: string): void {
          patchState(store, { category, page: 1 });
          load();
        },

        /** Aplica todos los filtros juntos (una sola petición). */
        applyFilters(filters: {
          query: string;
          status: CatalogProductStatus | null;
          category: string;
        }): void {
          patchState(store, {
            query: filters.query,
            status: filters.status,
            category: filters.category,
            page: 1,
          });
          load();
        },

        /** Navega a una página concreta. */
        goToPage(page: number): void {
          patchState(store, { page: Math.max(1, page) });
          load();
        },

        /** Alta de producto; recarga la página al terminar. */
        create: rxMethod<CreateCatalogProductData>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((data) =>
              repo.create(data).pipe(
                tap((product) => {
                  patchState(store, { saving: false, error: null, lastSaved: product });
                  notificationService.showSuccess(`Producto "${product.name}" creado.`);
                  load();
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo crear el producto.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Edición de producto; recarga la página al terminar. */
        update: rxMethod<{ id: string; data: UpdateCatalogProductData }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap(({ id, data }) =>
              repo.update(id, data).pipe(
                tap((product) => {
                  patchState(store, { saving: false, error: null, lastSaved: product });
                  notificationService.showSuccess(`Producto "${product.name}" actualizado.`);
                  load();
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el producto.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** El formulario confirma que ya cerró tras `lastSaved`. */
        acknowledgeSaved(): void {
          patchState(store, { lastSaved: null });
        },

        clearError(): void {
          patchState(store, { error: null });
        },

        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
