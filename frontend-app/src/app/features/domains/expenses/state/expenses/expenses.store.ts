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
  computeExpensesSummary,
  createExpenseRecord,
  filterExpenses,
  sanitizeExpenseRecords,
  updateExpenseRecord,
} from '../../adapters/expenses/expenses.adapter';
import {
  EXPENSE_CATEGORIES,
  EXPENSES_MAX_RECORDS,
  EXPENSES_PAGE_SIZE,
  expensesStorageKey,
  legacyExpensesStorageKey,
} from '../../constants/expenses.constants';
import type {
  CreateExpensePayload,
  ExpenseRecord,
  ExpenseType,
  ExpensesMutationResult,
} from '../../models/expense.model';
import type { ExpensesState } from './expenses.state';

const initialState: ExpensesState = {
  records: [],
  tab: 'all',
  type: 'all',
  statusFilter: 'all',
  category: 'all',
  search: '',
  page: 1,
};

function readStored(storageKey: string): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeExpenseRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, records: readonly ExpenseRecord[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    // Storage no disponible: los gastos viven solo en memoria.
  }
}

/**
 * Gastos del workspace de empresa (ADR-72). Extiende el ledger local con tipo,
 * estado, beneficiario, impuestos y recurrencia; migra los gastos del store de
 * finanzas anterior y mantiene los derivados en `withComputed`.
 */
export const ExpensesStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const auth = inject(AuthStore);
    const categories = computed(() => {
      const custom = [...new Set(store.records().map((record) => record.category))];
      const known = new Set(EXPENSE_CATEGORIES.map((category) => category.value));
      return [
        ...EXPENSE_CATEGORIES,
        ...custom
          .filter((category) => !known.has(category))
          .map((category) => ({ value: category, label: category })),
      ];
    });

    const filtered = computed(() =>
      filterExpenses(store.records(), {
        period: 'all',
        status: store.statusFilter() === 'all' ? 'all' : 'active',
        type: store.type(),
        category: store.category(),
        paymentMethod: 'all',
        beneficiary: '',
        search: store.search(),
      }).filter((record) => {
        if (store.tab() === 'scheduled' && record.type === 'inmediato') return false;
        if (store.statusFilter() === 'all') return true;
        return record.status === store.statusFilter();
      }),
    );

    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filtered().length / EXPENSES_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, store.page()), pageCount()));

    return {
      greeting: computed(() => {
        const hour = new Date().getHours();
        const prefix = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
        const name = auth.user()?.name?.trim().split(/\s+/)[0];
        return name ? `${prefix}, ${name}` : prefix;
      }),
      categoryLabels: computed<Record<string, string>>(() =>
        Object.fromEntries(categories().map((category) => [category.value, category.label])),
      ),
      categories,
      filtered,
      pageCount,
      currentPage,
      pagedRecords: computed(() =>
        filtered().slice(
          (currentPage() - 1) * EXPENSES_PAGE_SIZE,
          currentPage() * EXPENSES_PAGE_SIZE,
        ),
      ),
      summary: computed(() => computeExpensesSummary(store.records())),
      hasRecords: computed(() => store.records().length > 0),
      filteredCount: computed(() => filtered().length),
    };
  }),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addExpense(payload: CreateExpensePayload): ExpensesMutationResult {
      if (store.records().length >= EXPENSES_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de gastos.' };
      }
      const record = createExpenseRecord(payload);
      if (!record) {
        return { ok: false, message: 'Revisa concepto, categoría, tipo e importe.' };
      }
      patchState(store, { records: [record, ...store.records()], page: 1 });
      notificationService.showSuccess('Gasto registrado.');
      return { ok: true };
    },

    updateExpense(id: string, payload: CreateExpensePayload): ExpensesMutationResult {
      const current = store.records().find((record) => record.id === id);
      if (!current) return { ok: false, message: 'El gasto no existe.' };
      const record = updateExpenseRecord(current, payload);
      if (!record) {
        return { ok: false, message: 'Revisa concepto, categoría, tipo e importe.' };
      }
      patchState(store, {
        records: store.records().map((item) => (item.id === id ? record : item)),
      });
      notificationService.showSuccess('Gasto actualizado.');
      return { ok: true };
    },

    markPaid(id: string): void {
      patchState(store, {
        records: store
          .records()
          .map((record) => (record.id === id ? { ...record, status: 'pagado' } : record)),
      });
      notificationService.showSuccess('Gasto marcado como pagado.');
    },

    cancelExpense(id: string): void {
      patchState(store, {
        records: store
          .records()
          .map((record) => (record.id === id ? { ...record, status: 'cancelado' } : record)),
      });
      notificationService.showSuccess('Gasto cancelado.');
    },

    removeExpense(id: string): void {
      patchState(store, {
        records: store.records().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Gasto eliminado.');
    },

    setTab(tab: 'all' | 'scheduled'): void {
      patchState(store, { tab, page: 1 });
    },

    setType(type: 'all' | ExpenseType): void {
      patchState(store, { type, page: 1 });
    },

    setStatus(status: 'all' | 'pendiente' | 'pagado'): void {
      patchState(store, { statusFilter: status, page: 1 });
    },

    setCategory(category: string): void {
      patchState(store, { category, page: 1 });
    },

    setSearch(search: string): void {
      patchState(store, { search, page: 1 });
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
      const storageKey = expensesStorageKey(tenantId);
      const legacyKey = legacyExpensesStorageKey(tenantId);
      const stored = readStored(storageKey);
      const legacy = stored.length === 0 ? readStored(legacyKey) : [];
      const records = stored.length > 0 ? stored : legacy;
      if (records.length > 0) patchState(store, { records });

      effect(() => persist(storageKey, store.records()));
    },
  }),
);
