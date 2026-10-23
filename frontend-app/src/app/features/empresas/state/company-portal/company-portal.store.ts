import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import type { OrderResponse } from '../../../cart/public-api';
import type { CompanySalesSummary } from '../../models/company-sales.model';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';
import type { CompanyPortalState } from './company-portal.state';

const initialState: CompanyPortalState = {
  orders: [],
  sales: null,
  stores: [],
  ordersLoading: false,
  salesLoading: false,
  storesLoading: false,
  error: null,
  selectedOrderId: null,
  storeFilter: null,
  statusFilter: null,
};

/**
 * Portal de empresa (ADR-43): órdenes de `/orders/empresa`, estado de cuenta de
 * `/empresarios/me/ventas` y tiendas de `/empresarios/me/tiendas`.
 */
export const CompanyPortalStore = signalStore(
  withState(initialState),
  withComputed(({ orders, sales, stores, selectedOrderId }) => ({
    selectedOrder: computed(() => {
      const id = selectedOrderId();
      return id ? (orders().find((order) => order.id === id) ?? null) : null;
    }),
    salesSummary: computed<CompanySalesSummary>(() => {
      const account = sales();
      const companySales = account?.sales ?? [];
      return {
        totalSales: companySales.reduce((sum, sale) => sum + sale.sale, 0),
        totalCommission: companySales.reduce((sum, sale) => sum + sale.commission, 0),
        totalCompanyAmount: companySales.reduce((sum, sale) => sum + sale.companyAmount, 0),
        salesCount: companySales.length,
      };
    }),
    pendingCommissions: computed(() => sales()?.pendingCommissions ?? 0),
    storeCount: computed(() => stores().length),
    availableStores: computed(() => stores().filter((store) => !store.sellerId)),
    hasOrders: computed(() => orders().length > 0),
  })),
  withMethods(
    (
      store,
      portalRepo = inject(COMPANY_PORTAL_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      loadOrders: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { ordersLoading: true, error: null })),
          switchMap(() =>
            portalRepo
              .orders({
                ...(store.storeFilter() ? { storeId: store.storeFilter()! } : {}),
                ...(store.statusFilter() ? { status: store.statusFilter()! } : {}),
                limit: 100,
              })
              .pipe(
                tap((orders) => {
                  const selected = store.selectedOrderId();
                  patchState(store, {
                    orders,
                    ordersLoading: false,
                    selectedOrderId: orders.some((order) => String(order.id) === selected)
                      ? selected
                      : null,
                    error: null,
                  });
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudieron cargar las ventas.';
                  patchState(store, { ordersLoading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
          ),
        ),
      ),

      loadSales: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { salesLoading: true, error: null })),
          switchMap(() =>
            portalRepo.sales().pipe(
              tap((sales) => patchState(store, { sales, salesLoading: false, error: null })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el estado de cuenta.';
                patchState(store, { salesLoading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadStores: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { storesLoading: true, error: null })),
          switchMap(() =>
            portalRepo.stores().pipe(
              tap((stores) => patchState(store, { stores, storesLoading: false, error: null })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar las tiendas.';
                patchState(store, { storesLoading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      setStoreFilter(storeId: string | null): void {
        patchState(store, { storeFilter: storeId });
      },

      setStatusFilter(status: string | null): void {
        patchState(store, { statusFilter: status });
      },

      selectOrder(order: OrderResponse): void {
        patchState(store, { selectedOrderId: String(order.id) });
      },

      closeOrder(): void {
        patchState(store, { selectedOrderId: null });
      },

      clearError(): void {
        patchState(store, { error: null });
      },

      reset(): void {
        patchState(store, initialState);
      },
    }),
  ),
);
