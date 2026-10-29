import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  cashToday,
  computeBankAccounts,
  computeCashSummary,
  computeDailyClosures,
  computeMovementBalances,
  computePaymentBreakdown,
  createCashMovement,
  filterCashMovements,
  sanitizeCashMovements,
  toMovementRows,
  updateCashMovement,
} from '../../adapters/cash/cash.adapter';
import {
  CASH_ACCOUNTS,
  CASH_CATEGORIES,
  CASH_MAX_RECORDS,
  CASH_PAGE_SIZE,
  CASH_PAYMENT_METHODS,
  CASH_STATUSES,
  CASH_MOVEMENT_TYPES,
  cashStorageKey,
  legacyCashStorageKey,
} from '../../constants/cash.constants';
import type {
  CashFilters,
  CashMovement,
  CashMutationResult,
  CashStatusFilter,
  CashTab,
  CreateCashMovementPayload,
} from '../../models/cash.model';
import type { CashState } from './cash.state';

const initialState: CashState = {
  records: [],
  tab: 'movements',
  period: 'month',
  type: 'all',
  status: 'all',
  category: 'all',
  paymentMethod: 'all',
  search: '',
  page: 1,
};

const BANK_ACCOUNTS = new Set(
  CASH_ACCOUNTS.filter((account) => account.kind === 'banco').map((account) => account.value),
);

function readStored(storageKey: string): CashMovement[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeCashMovements(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, records: readonly CashMovement[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    // Storage no disponible: los movimientos viven solo en memoria.
  }
}

/**
 * Caja del workspace de empresa (ADR-73). Movimientos de caja y bancos con
 * métodos de pago, cierres diarios, caja chica y transferencias; migra los
 * movimientos del store de finanzas anterior y deriva todo en `withComputed`.
 */
export const CashStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const auth = inject(AuthStore);

    const categoryLabels = computed<Record<string, string>>(() =>
      Object.fromEntries(CASH_CATEGORIES.map((category) => [category.value, category.label])),
    );
    const paymentLabels = computed<Record<string, string>>(() =>
      Object.fromEntries(CASH_PAYMENT_METHODS.map((method) => [method.value, method.label])),
    );
    const statusLabels = computed<Record<string, string>>(() =>
      Object.fromEntries(CASH_STATUSES.map((status) => [status.value, status.label])),
    );
    const typeLabels = computed<Record<string, string>>(() =>
      Object.fromEntries(CASH_MOVEMENT_TYPES.map((type) => [type.value, type.label])),
    );
    const accountLabels = computed<Record<string, string>>(() =>
      Object.fromEntries(CASH_ACCOUNTS.map((account) => [account.value, account.label])),
    );

    const filtered = computed(() =>
      filterCashMovements(store.records(), {
        period: store.period(),
        type: store.type(),
        status: store.status(),
        category: store.category(),
        paymentMethod: store.paymentMethod(),
        search: store.search(),
      }),
    );

    const activeRecords = computed(() => {
      const records = filtered();
      if (store.tab() === 'petty-cash') {
        return records.filter((record) => record.category === 'caja-chica');
      }
      if (store.tab() === 'transfers') {
        return records.filter((record) => record.category === 'transferencia');
      }
      if (store.tab() === 'banks') {
        return records.filter((record) => BANK_ACCOUNTS.has(record.account));
      }
      return records;
    });

    const pageCount = computed(() =>
      Math.max(1, Math.ceil(activeRecords().length / CASH_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, store.page()), pageCount()));
    const pagedRecords = computed(() =>
      activeRecords().slice((currentPage() - 1) * CASH_PAGE_SIZE, currentPage() * CASH_PAGE_SIZE),
    );
    const balances = computed(() => computeMovementBalances(store.records()));

    return {
      greeting: computed(() => {
        const hour = new Date().getHours();
        const prefix = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
        const name = auth.user()?.name?.trim().split(/\s+/)[0];
        return name ? `${prefix}, ${name}` : prefix;
      }),
      categoryLabels,
      paymentLabels,
      statusLabels,
      typeLabels,
      accountLabels,
      filtered,
      activeRecords,
      pageCount,
      currentPage,
      pagedRecords,
      movementRows: computed(() => toMovementRows(pagedRecords(), balances())),
      paymentBreakdown: computed(() => computePaymentBreakdown(store.records())),
      dailyClosures: computed(() => computeDailyClosures(store.records(), new Date())),
      bankAccounts: computed(() => computeBankAccounts(store.records())),
      summary: computed(() => computeCashSummary(store.records(), new Date())),
      today: computed(() => cashToday(new Date())),
      hasRecords: computed(() => store.records().length > 0),
      filteredCount: computed(() => activeRecords().length),
      filters: computed<CashFilters>(() => ({
        period: store.period(),
        type: store.type(),
        status: store.status(),
        category: store.category(),
        paymentMethod: store.paymentMethod(),
        search: store.search(),
      })),
    };
  }),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addMovement(payload: CreateCashMovementPayload): CashMutationResult {
      if (store.records().length >= CASH_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de movimientos.' };
      }
      const record = createCashMovement(payload);
      if (!record) {
        return { ok: false, message: 'Revisa concepto, tipo, categoría e importe.' };
      }
      patchState(store, { records: [record, ...store.records()], page: 1 });
      notificationService.showSuccess('Movimiento registrado.');
      return { ok: true };
    },

    updateMovement(id: string, payload: CreateCashMovementPayload): CashMutationResult {
      const current = store.records().find((record) => record.id === id);
      if (!current) return { ok: false, message: 'El movimiento no existe.' };
      const record = updateCashMovement(current, payload);
      if (!record) {
        return { ok: false, message: 'Revisa concepto, tipo, categoría e importe.' };
      }
      patchState(store, {
        records: store.records().map((item) => (item.id === id ? record : item)),
      });
      notificationService.showSuccess('Movimiento actualizado.');
      return { ok: true };
    },

    confirmMovement(id: string): void {
      patchState(store, {
        records: store
          .records()
          .map((record) => (record.id === id ? { ...record, status: 'confirmado' } : record)),
      });
      notificationService.showSuccess('Movimiento confirmado.');
    },

    annulMovement(id: string): void {
      patchState(store, {
        records: store
          .records()
          .map((record) => (record.id === id ? { ...record, status: 'anulado' } : record)),
      });
      notificationService.showSuccess('Movimiento anulado.');
    },

    removeMovement(id: string): void {
      patchState(store, {
        records: store.records().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Movimiento eliminado.');
    },

    setTab(tab: CashTab): void {
      patchState(store, { tab, category: 'all', page: 1 });
    },

    setPeriod(period: CashState['period']): void {
      patchState(store, { period, page: 1 });
    },

    setType(type: CashState['type']): void {
      patchState(store, { type, page: 1 });
    },

    setStatus(status: CashStatusFilter): void {
      patchState(store, { status, page: 1 });
    },

    setCategory(category: CashState['category']): void {
      patchState(store, { category, page: 1 });
    },

    setPaymentMethod(paymentMethod: CashState['paymentMethod']): void {
      patchState(store, { paymentMethod, page: 1 });
    },

    setSearch(search: string): void {
      patchState(store, { search, page: 1 });
    },

    resetFilters(): void {
      patchState(store, {
        period: 'month',
        type: 'all',
        status: 'all',
        category: 'all',
        paymentMethod: 'all',
        search: '',
        page: 1,
      });
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
  })),
  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);
      const tenantId = authStore.user()?.tenantId;
      const storageKey = cashStorageKey(tenantId);
      const legacyKey = legacyCashStorageKey(tenantId);
      const stored = readStored(storageKey);
      const legacy = stored.length === 0 ? readStored(legacyKey) : [];
      const records = stored.length > 0 ? stored : legacy;
      if (records.length > 0) patchState(store, { records });

      effect(() => persist(storageKey, store.records()));
    },
  }),
);
