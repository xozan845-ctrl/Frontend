import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { INVENTORY_REPOSITORY } from '../../repositories/inventory.repository';
import type { InventoryState } from './inventory.state';

const initialState: InventoryState = {
  lines: [],
  loading: false,
  error: null,
  query: '',
  status: null,
};

/** Minúsculas sin acentos para buscar por SKU o nombre. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Inventario de bodega (ADR-33, solo admin): carga `GET /admin/inventario` y
 * deriva búsqueda, filtro por estado y totales.
 */
export const InventoryStore = signalStore(
  withState(initialState),
  withComputed(({ lines, query, status }) => {
    const filteredLines = computed(() => {
      const needle = normalize(query());
      return lines().filter(
        (line) =>
          (!status() || line.status === status()) &&
          (!needle ||
            normalize(line.sku).includes(needle) ||
            normalize(line.name).includes(needle)),
      );
    });

    return {
      filteredLines,
      totalSkus: () => lines().length,
      totalStock: () => lines().reduce((sum, line) => sum + line.stock, 0),
      totalAvailable: () => lines().reduce((sum, line) => sum + line.available, 0),
      totalReserved: () => lines().reduce((sum, line) => sum + line.reserved, 0),
      totalValueCents: () => lines().reduce((sum, line) => sum + line.totalValueCents, 0),
      hasLines: () => lines().length > 0,
    };
  }),
  withMethods(
    (
      store,
      inventoryRepo = inject(INVENTORY_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const load = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            inventoryRepo.list().pipe(
              tap((lines) => patchState(store, { lines, loading: false, error: null })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el inventario.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        /** Carga el inventario de bodega. */
        load,

        /** Reintenta la carga. */
        refresh(): void {
          load();
        },

        /** Filtro por SKU o nombre. */
        setQuery(query: string): void {
          patchState(store, { query });
        },

        /** Filtro por estado (`null` = todos). */
        setStatus(status: string | null): void {
          patchState(store, { status });
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
