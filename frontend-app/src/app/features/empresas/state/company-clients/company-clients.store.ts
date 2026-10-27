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
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import type { OrderResponse } from '../../../cart/public-api';
import {
  buildCompanyClients,
  computeCompanyClientKpis,
  createCompanyClientRecord,
  filterCompanyClientsByChip,
  filterCompanyClientsByTab,
  findDuplicateCompanyClient,
  parseCompanyClientsCsv,
  sanitizeCompanyClientRecords,
  searchCompanyClients,
} from '../../adapters/company-client/company-client.adapter';
import {
  COMPANY_CLIENT_PAGE_SIZE,
  companyClientsStorageKey,
} from '../../constants/company-clients.constants';
import type {
  CompanyClientChip,
  CompanyClientImportResult,
  CompanyClientMutationResult,
  CompanyClientRecord,
  CompanyClientsTab,
  CreateCompanyClientPayload,
} from '../../models/company-client.model';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';
import type { CompanyClientsState } from './company-clients.state';

const initialState: CompanyClientsState = {
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
function loadStoredCompanyClients(storageKey: string): CompanyClientRecord[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeCompanyClientRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/** Persiste la cartera local; un storage lleno o bloqueado no rompe la UI. */
function persistCompanyClients(storageKey: string, records: readonly CompanyClientRecord[]): void {
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
export const CompanyClientsStore = signalStore(
  withState(initialState),
  withComputed(({ orders, localClients, search, tab, chip, page }) => {
    const allClients = computed(() => buildCompanyClients(orders(), localClients()));
    const kpis = computed(() => computeCompanyClientKpis(allClients()));
    const tabClients = computed(() => filterCompanyClientsByTab(allClients(), tab()));
    const filteredClients = computed(() =>
      searchCompanyClients(filterCompanyClientsByChip(tabClients(), chip()), search()),
    );
    const filteredCount = computed(() => filteredClients().length);
    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filteredCount() / COMPANY_CLIENT_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, page()), pageCount()));
    const pagedClients = computed(() =>
      filteredClients().slice(
        (currentPage() - 1) * COMPANY_CLIENT_PAGE_SIZE,
        currentPage() * COMPANY_CLIENT_PAGE_SIZE,
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
        filteredCount() === 0 ? 0 : (currentPage() - 1) * COMPANY_CLIENT_PAGE_SIZE + 1,
      ),
      rangeEnd: computed(() => Math.min(currentPage() * COMPANY_CLIENT_PAGE_SIZE, filteredCount())),
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
      portalRepo = inject(COMPANY_PORTAL_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      /** Sincroniza las compras de la empresa para recalcular la cartera. */
      loadOrders: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { ordersLoading: true, error: null })),
          switchMap(() =>
            portalRepo.orders({ limit: 100 }).pipe(
              tap((orders: OrderResponse[]) => {
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

      setTab(tab: CompanyClientsTab): void {
        patchState(store, { tab, page: 1 });
      },

      setChip(chip: CompanyClientChip): void {
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
      addLocalClient(payload: CreateCompanyClientPayload): CompanyClientMutationResult {
        const candidate = createCompanyClientRecord(payload, 'manual');
        if (findDuplicateCompanyClient(store.localClients(), candidate)) {
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
      importCsv(text: string): CompanyClientImportResult {
        const parsed = parseCompanyClientsCsv(text);
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
          const candidate = createCompanyClientRecord(row, 'import');
          if (findDuplicateCompanyClient(records, candidate)) {
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
      const authStore = inject(AuthStore);
      const storageKey = companyClientsStorageKey(authStore.user()?.tenantId);
      const stored = loadStoredCompanyClients(storageKey);
      if (stored.length > 0) patchState(store, { localClients: stored });

      effect(() => {
        persistCompanyClients(storageKey, store.localClients());
      });
    },
  }),
);
