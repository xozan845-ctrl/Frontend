import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, of, pipe } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../products/public-api';
import {
  buildInventoryCsv,
  buildProductRow,
  buildProductTemplateCsv,
  computeProductKpis,
  filterCatalogRows,
  formToProductCreate,
  formToProductUpdate,
  parseCatalogMoney,
  sortCatalogRows,
} from '../../adapters/company-catalog/company-catalog.adapter';
import {
  COMPANY_CATALOG_PAGE_SIZE,
  COMPANY_PRODUCT_API_PAGE_SIZE,
} from '../../constants/company-products.constants';
import type {
  CompanyCatalogFormValue,
  CompanyCatalogSort,
  CompanyCatalogStatusFilter,
} from '../../models/company-catalog.model';
import type { CompanyProductsState } from './company-products.state';

const initialState: CompanyProductsState = {
  products: [],
  query: '',
  status: 'todos',
  brand: '',
  sort: 'nombre-az',
  onlyRawMaterial: false,
  page: 1,
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
};

/** Valida precio y costo antes de enviar; `null` si el formulario es válido. */
function validateProductForm(form: CompanyCatalogFormValue): string | null {
  if (parseCatalogMoney(form.price) === null) return 'Revisa el precio del producto.';
  if (form.cost.trim() && parseCatalogMoney(form.cost) === null) {
    return 'Revisa el costo del producto.';
  }
  return null;
}

/**
 * Catálogo administrable de productos (ADR-55): carga todas las páginas del
 * API y deriva filas, filtros y KPIs. Los metadatos operativos vienen del
 * backend en el propio producto; `localStorage` ya no es fuente de verdad
 * (R-PS-01).
 */
export const CompanyProductsStore = signalStore(
  withState(initialState),
  withComputed(({ products, query, status, brand, sort, page, onlyRawMaterial }) => {
    const rows = computed(() => products().map((product) => buildProductRow(product)));
    const filteredRows = computed(() =>
      sortCatalogRows(
        filterCatalogRows(rows(), {
          query: query(),
          status: status(),
          brand: brand(),
          sort: sort(),
          onlyRawMaterial: onlyRawMaterial(),
        }),
        sort(),
      ),
    );
    const filteredCount = computed(() => filteredRows().length);
    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filteredCount() / COMPANY_CATALOG_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, page()), pageCount()));

    return {
      rows,
      filteredRows,
      filteredCount,
      total: computed(() => rows().length),
      pageCount,
      currentPage,
      pagedRows: computed(() =>
        filteredRows().slice(
          (currentPage() - 1) * COMPANY_CATALOG_PAGE_SIZE,
          currentPage() * COMPANY_CATALOG_PAGE_SIZE,
        ),
      ),
      categories: computed(() =>
        Array.from(
          new Set(
            rows()
              .map((row) => row.category)
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, 'es')),
      ),
      brands: computed(() =>
        Array.from(
          new Set(
            rows()
              .map((row) => row.brand)
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, 'es')),
      ),
      kpis: computed(() => computeProductKpis(rows())),
      rawMaterialCount: computed(() => rows().filter((row) => row.isRawMaterial).length),
      hasProducts: computed(() => rows().length > 0),
      hasFilteredProducts: computed(() => filteredCount() > 0),
      hasFilters: computed(
        () => query().trim().length > 0 || status() !== 'todos' || brand().length > 0,
      ),
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
    };
  }),
  withMethods(
    (
      store,
      repo = inject(CATALOG_PRODUCT_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const loadPage = (page: number) => repo.list({ page, limit: COMPANY_PRODUCT_API_PAGE_SIZE });

      return {
        /** Carga todas las páginas (máximo 100 por petición) y las une. */
        load: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() =>
              loadPage(1).pipe(
                switchMap((first) => {
                  if (first.pages <= 1) return of(first.items);
                  const requests = Array.from({ length: first.pages - 1 }, (_, index) =>
                    loadPage(index + 2),
                  );
                  return forkJoin(requests).pipe(
                    map((pages) => [...first.items, ...pages.flatMap((page) => page.items)]),
                  );
                }),
                tap((products) => patchState(store, { products, loading: false, error: null })),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo cargar el catálogo.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Alta de producto: el backend persiste producto y metadatos juntos. */
        create: rxMethod<CompanyCatalogFormValue>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((form) => {
              const validationError = validateProductForm(form);
              if (validationError) {
                patchState(store, { saving: false, error: validationError });
                notificationService.showError(validationError);
                return EMPTY;
              }

              return repo.create(formToProductCreate(form)).pipe(
                tap((product) => {
                  patchState(store, {
                    products: [
                      product,
                      ...store.products().filter((current) => current.id !== product.id),
                    ],
                    saving: false,
                    error: null,
                    lastSaved: product,
                  });
                  notificationService.showSuccess(`Producto "${product.name}" creado.`);
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo crear el producto.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        /** Edición del producto (SKU inmutable); se confirma con la respuesta. */
        update: rxMethod<{ id: string; data: CompanyCatalogFormValue }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap(({ id, data }) => {
              const validationError = validateProductForm(data);
              if (validationError) {
                patchState(store, { saving: false, error: validationError });
                notificationService.showError(validationError);
                return EMPTY;
              }

              return repo.update(id, formToProductUpdate(data)).pipe(
                tap((product) => {
                  patchState(store, {
                    products: store
                      .products()
                      .map((current) => (current.id === id ? product : current)),
                    saving: false,
                    error: null,
                    lastSaved: product,
                  });
                  notificationService.showSuccess(`Producto "${product.name}" actualizado.`);
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el producto.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        /** Plantilla CSV de importación. */
        templateCsv(): string {
          return buildProductTemplateCsv();
        },

        /** CSV de las filas filtradas del catálogo. */
        inventoryCsv(): string {
          return buildInventoryCsv(store.filteredRows());
        },

        setQuery(query: string): void {
          patchState(store, { query, page: 1 });
        },

        setStatus(status: CompanyCatalogStatusFilter): void {
          patchState(store, { status, page: 1 });
        },

        setBrand(brand: string): void {
          patchState(store, { brand, page: 1 });
        },

        setSort(sort: CompanyCatalogSort): void {
          patchState(store, { sort, page: 1 });
        },

        setOnlyRawMaterial(onlyRawMaterial: boolean): void {
          patchState(store, { onlyRawMaterial, page: 1 });
        },

        setPage(page: number): void {
          patchState(store, { page: Math.max(1, Math.trunc(page)) });
        },

        nextPage(): void {
          if (store.currentPage() < store.pageCount()) {
            patchState(store, { page: store.currentPage() + 1 });
          }
        },

        previousPage(): void {
          if (store.currentPage() > 1) {
            patchState(store, { page: store.currentPage() - 1 });
          }
        },

        clearFilters(): void {
          patchState(store, {
            query: '',
            status: 'todos',
            brand: '',
            sort: 'nombre-az',
            page: 1,
          });
        },

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
