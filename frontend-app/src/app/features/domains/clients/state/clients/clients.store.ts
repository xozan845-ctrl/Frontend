import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import {
  buildClients,
  computeClientKpis,
  createClientRecord,
  filterClientsByChip,
  filterClientsByTab,
  findDuplicateClient,
  parseClientsCsv,
  sanitizeClientRecords,
  searchClients,
} from '../../adapters/clients/client.adapter';
import { CLIENT_PAGE_SIZE } from '../../constants/clients.constants';
import type {
  ClientChip,
  ClientImportResult,
  ClientMutationResult,
  ClientRecord,
  ClientsTab,
  CreateClientPayload,
} from '../../models/client.model';
import { CLIENTS_DATA_SOURCE } from '../../repositories/clients-data-source.repository';
import type { ClientsState } from './clients.state';

const initialState: ClientsState = {
  orders: [],
  localClients: [],
  ordersLoading: false,
  error: null,
  search: '',
  tab: 'list',
  chip: 'all',
  page: 1,
};

/** Lee la cartera local sin romper la página si el storage no está disponible. */
function loadStoredClients(storageKey: string): ClientRecord[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeClientRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/** Persiste la cartera local; un storage lleno o bloqueado no rompe la UI. */
function persistClients(storageKey: string, records: readonly ClientRecord[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    // Storage no disponible: la cartera vive solo en memoria.
  }
}

/**
 * Cartera de clientes del workspace de empresa (ADR-51). Los clientes con
 * compras se derivan de `/orders/empresa` agrupando por `buyerId`; los clientes
 * manuales/importados se guardan en `localStorage` por tenant hasta que Core
 * Engine exponga un endpoint de clientes de empresa.
 */
export const ClientsStore = signalStore(
  withState(initialState),
  withComputed(({ orders, localClients, search, tab, chip, page }) => {
    const allClients = computed(() => buildClients(orders(), localClients()));
    const kpis = computed(() => computeClientKpis(allClients()));
    const tabClients = computed(() => filterClientsByTab(allClients(), tab()));
    const filteredClients = computed(() =>
      searchClients(filterClientsByChip(tabClients(), chip()), search()),
    );
    const filteredCount = computed(() => filteredClients().length);
    const pageCount = computed(() => Math.max(1, Math.ceil(filteredCount() / CLIENT_PAGE_SIZE)));
    const currentPage = computed(() => Math.min(Math.max(1, page()), pageCount()));
    const pagedClients = computed(() =>
      filteredClients().slice(
        (currentPage() - 1) * CLIENT_PAGE_SIZE,
        currentPage() * CLIENT_PAGE_SIZE,
      ),
    );
    const hasClients = computed(() => allClients().length > 0);
    const hasFilteredClients = computed(() => filteredCount() > 0);
    const hasSearch = computed(() => search().trim().length > 0);
    const hasFilters = computed(() => tab() !== 'list' || chip() !== 'all' || hasSearch());

    return {
      allClients,
      kpis,
      tabClients,
      filteredClients,
      filteredCount,
      pageCount,
      currentPage,
      pagedClients,
      rangeStart: computed(() =>
        filteredCount() === 0 ? 0 : (currentPage() - 1) * CLIENT_PAGE_SIZE + 1,
      ),
      rangeEnd: computed(() => Math.min(currentPage() * CLIENT_PAGE_SIZE, filteredCount())),
      hasClients,
      hasFilteredClients,
      hasSearch,
      hasFilters,
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
    };
  }),
  withMethods(
    (
      store,
      dataSource = inject(CLIENTS_DATA_SOURCE),
      notificationService = inject(NotificationService),
    ) => ({
      /** Sincroniza las compras de la empresa para recalcular la cartera. */
      loadOrders: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { ordersLoading: true, error: null })),
          switchMap(() =>
            dataSource.orders().pipe(
              tap((orders) => {
                patchState(store, {
                  orders,
                  ordersLoading: false,
                  error: null,
                  page: 1,
                });
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar los clientes.';
                patchState(store, { ordersLoading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      /** Búsqueda local por nombre, teléfono, correo, empresa o comprador. */
      setSearch(text: string): void {
        patchState(store, { search: text, page: 1 });
      },

      setTab(tab: ClientsTab): void {
        patchState(store, { tab, page: 1 });
      },

      setChip(chip: ClientChip): void {
        patchState(store, { chip, page: 1 });
      },

      setPage(page: number): void {
        patchState(store, { page: Math.max(1, Math.trunc(page)) });
      },

      nextPage(): void {
        if (store.currentPage() < store.pageCount()) {
          patchState(store, { page: store.currentPage() + 1 });
        }
      },

      prevPage(): void {
        if (store.currentPage() > 1) {
          patchState(store, { page: store.currentPage() - 1 });
        }
      },

      clearFilters(): void {
        patchState(store, { search: '', tab: 'list', chip: 'all', page: 1 });
      },

      /** Registra un cliente manual y lo deja visible en la lista. */
      addLocalClient(payload: CreateClientPayload): ClientMutationResult {
        const candidate = createClientRecord(payload, 'manual');
        if (findDuplicateClient(store.localClients(), candidate)) {
          return {
            ok: false,
            message: 'Ya existe un cliente con ese comprador, correo o teléfono.',
          };
        }

        patchState(store, {
          localClients: [...store.localClients(), candidate],
          search: '',
          tab: 'list',
          chip: 'all',
          page: 1,
        });
        notificationService.showSuccess(`Cliente ${candidate.name} agregado.`);
        return { ok: true, clientId: candidate.id };
      },

      /**
       * Importa un CSV compatible con Excel. Las filas inválidas y los
       * duplicados se omiten; el resultado permite explicar el motivo.
       */
      importCsv(text: string): ClientImportResult {
        const parsed = parseClientsCsv(text);
        if (parsed.rows.length === 0) {
          const message = parsed.errors[0] ?? 'No se encontraron clientes en el archivo.';
          notificationService.showError(message);
          return {
            imported: 0,
            skipped: Math.max(1, parsed.errors.length),
            errors: parsed.errors.length > 0 ? parsed.errors : [message],
          };
        }

        const records = [...store.localClients()];
        let imported = 0;
        let skipped = parsed.errors.length;

        for (const row of parsed.rows) {
          const candidate = createClientRecord(row, 'import');
          if (findDuplicateClient(records, candidate)) {
            skipped += 1;
            continue;
          }
          records.push(candidate);
          imported += 1;
        }

        if (imported > 0) {
          patchState(store, {
            localClients: records,
            search: '',
            tab: 'list',
            chip: 'all',
            page: 1,
          });
          notificationService.showSuccess(
            imported === 1 ? '1 cliente importado.' : `${imported} clientes importados.`,
          );
          if (skipped > 0) {
            notificationService.showInfo(
              skipped === 1
                ? '1 fila se omitió por estar duplicada o incompleta.'
                : `${skipped} filas se omitieron por estar duplicadas o incompletas.`,
            );
          }
        } else {
          const message =
            parsed.errors[0] ?? 'No se importó ningún cliente: todas las filas están duplicadas.';
          notificationService.showError(message);
        }

        return { imported, skipped, errors: parsed.errors };
      },

      clearError(): void {
        patchState(store, { error: null });
      },

      reset(): void {
        patchState(store, initialState);
      },
    }),
  ),
  withHooks({
    onInit(store) {
      const dataSource = inject(CLIENTS_DATA_SOURCE);
      const storageKey = dataSource.storageKey();
      const stored = loadStoredClients(storageKey);
      if (stored.length > 0) patchState(store, { localClients: stored });

      effect(() => {
        persistClients(storageKey, store.localClients());
      });
    },
  }),
);
