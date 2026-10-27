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
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../products/public-api';
import {
  buildCompanySaleRows,
  buildRecurringClients,
  computeCompanySaleKpis,
  createCompanySaleId,
  createCompanySaleRecord,
  filterCompanySaleRows,
  nextCompanySaleNumber,
  sanitizeCompanySaleRecords,
} from '../../adapters/company-sale/company-sale.adapter';
import {
  buildCompanyClients,
  sanitizeCompanyClientRecords,
} from '../../adapters/company-client/company-client.adapter';
import {
  COMPANY_SALE_DEFAULT_PROVIDER,
  COMPANY_SALE_MAX_RECORDS,
  COMPANY_SALE_PAGE_SIZE,
  companySalesStorageKey,
} from '../../constants/company-sales.constants';
import { companyClientsStorageKey } from '../../constants/company-clients.constants';
import type {
  CompanySaleMutationResult,
  CompanySalePaymentFilter,
  CompanySalePeriod,
  CompanySaleRecord,
  CreateCompanySalePayload,
} from '../../models/company-sale.model';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';
import type { CompanySalesState } from './company-sales.state';

const initialState: CompanySalesState = {
  orders: [],
  products: [],
  stores: [],
  salesAccount: null,
  localSales: [],
  localClients: [],
  loading: false,
  productsLoading: false,
  error: null,
  period: 'month',
  payment: 'all',
  search: '',
  customFrom: '',
  customTo: '',
  page: 1,
  lastCreated: null,
};

function loadStoredSales(storageKey: string): CompanySalesState['localSales'] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeCompanySaleRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persistSales(storageKey: string, sales: readonly CompanySaleRecord[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sales));
  } catch {
    // Storage no disponible: las ventas viven solo en memoria.
  }
}

function loadStoredClients(storageKey: string): CompanySalesState['localClients'] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeCompanyClientRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/**
 * Ventas del workspace de empresa (ADR-53). Combina las órdenes reales de
 * `/orders/empresa` con las ventas locales registradas desde los modales de
 * POS. Los derivados (KPIs, filtros, recurrentes y paginación) viven en
 * `withComputed`; la página solo consume señales.
 */
export const CompanySalesStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const clients = computed(() => buildCompanyClients(store.orders(), store.localClients()));

    const rows = computed(() =>
      buildCompanySaleRows({
        orders: store.orders(),
        clients: clients(),
        stores: store.stores(),
        salesAccount: store.salesAccount(),
        localSales: store.localSales(),
      }),
    );

    const filteredRows = computed(() =>
      filterCompanySaleRows(rows(), {
        period: store.period(),
        payment: store.payment(),
        search: store.search(),
        customFrom: store.customFrom(),
        customTo: store.customTo(),
      }),
    );

    const filteredCount = computed(() => filteredRows().length);
    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filteredCount() / COMPANY_SALE_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, store.page()), pageCount()));

    return {
      clients,
      rows,
      filteredRows,
      filteredCount,
      pageCount,
      currentPage,
      pagedRows: computed(() =>
        filteredRows().slice(
          (currentPage() - 1) * COMPANY_SALE_PAGE_SIZE,
          currentPage() * COMPANY_SALE_PAGE_SIZE,
        ),
      ),
      kpis: computed(() => computeCompanySaleKpis(rows())),
      recurringClients: computed(() => buildRecurringClients(clients())),
      nextNumber: computed(() => nextCompanySaleNumber(store.localSales())),
      providerName: computed(() => store.stores()[0]?.name ?? COMPANY_SALE_DEFAULT_PROVIDER),
      hasRows: computed(() => rows().length > 0),
      hasFilteredRows: computed(() => filteredCount() > 0),
      hasFilters: computed(
        () =>
          store.period() !== 'month' ||
          store.payment() !== 'all' ||
          store.search().trim().length > 0,
      ),
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
      hasProducts: computed(() => store.products().length > 0),
      activeProducts: computed(() =>
        store.products().filter((product) => product.status === 'disponible'),
      ),
    };
  }),
  withMethods(
    (
      store,
      portalRepo = inject(COMPANY_PORTAL_REPOSITORY),
      catalogRepo = inject(CATALOG_PRODUCT_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      loadOrders: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            portalRepo.orders({ limit: 100 }).pipe(
              tap((orders) => patchState(store, { orders, loading: false, error: null })),
              catchError((error: Error) => {
                const message = error.message || 'No se pudieron cargar las ventas.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { productsLoading: true, error: null })),
          switchMap(() =>
            catalogRepo.list({ limit: 100, status: 'disponible' }).pipe(
              map((page) => page.items),
              tap((products) =>
                patchState(store, { products, productsLoading: false, error: null }),
              ),
              catchError((error: Error) => {
                const message = error.message || 'No se pudo cargar el catálogo.';
                patchState(store, { productsLoading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadStores: rxMethod<void>(
        pipe(
          switchMap(() =>
            portalRepo.stores().pipe(
              tap((stores) => patchState(store, { stores })),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),

      loadSales: rxMethod<void>(
        pipe(
          switchMap(() =>
            portalRepo.sales().pipe(
              tap((salesAccount) => patchState(store, { salesAccount })),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),

      createSale(payload: CreateCompanySalePayload): CompanySaleMutationResult {
        if (store.localSales().length >= COMPANY_SALE_MAX_RECORDS) {
          return {
            ok: false,
            message: 'Alcanzaste el límite de ventas locales. Contacta a soporte para migrarlas.',
          };
        }

        const record = createCompanySaleRecord(payload, {
          id: createCompanySaleId(),
          number: nextCompanySaleNumber(store.localSales()),
          now: new Date().toISOString(),
          providerName: store.providerName(),
        });
        if (!record) {
          return {
            ok: false,
            message: 'Revisa el cliente, las líneas y el total antes de registrar la venta.',
          };
        }

        patchState(store, {
          localSales: [record, ...store.localSales()],
          lastCreated: record,
          page: 1,
        });
        notificationService.showSuccess(`Venta ${record.number} registrada.`);
        return { ok: true, sale: record };
      },

      setPeriod(period: CompanySalePeriod): void {
        patchState(store, { period, page: 1 });
      },

      setPayment(payment: CompanySalePaymentFilter): void {
        patchState(store, { payment, page: 1 });
      },

      setSearch(search: string): void {
        patchState(store, { search, page: 1 });
      },

      setCustomFrom(customFrom: string): void {
        patchState(store, { customFrom, page: 1 });
      },

      setCustomTo(customTo: string): void {
        patchState(store, { customTo, page: 1 });
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
          period: 'month',
          payment: 'all',
          search: '',
          customFrom: '',
          customTo: '',
          page: 1,
        });
      },

      reset(): void {
        patchState(store, {
          ...initialState,
          localSales: store.localSales(),
          localClients: store.localClients(),
        });
      },
    }),
  ),
  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);
      const tenantId = authStore.user()?.tenantId;
      const salesKey = companySalesStorageKey(tenantId);
      const clientsKey = companyClientsStorageKey(tenantId);
      const storedSales = loadStoredSales(salesKey);
      const storedClients = loadStoredClients(clientsKey);

      if (storedSales.length > 0) patchState(store, { localSales: storedSales });
      if (storedClients.length > 0) patchState(store, { localClients: storedClients });

      effect(() => {
        persistSales(salesKey, store.localSales());
      });
    },
  }),
);
