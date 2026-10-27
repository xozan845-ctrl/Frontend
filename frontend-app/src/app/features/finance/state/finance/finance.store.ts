import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import {
  computeFinanceSummary,
  createCashMovement,
  createExpenseRecord,
  createPurchaseRecord,
  sanitizeCashMovements,
  sanitizeExpenseRecords,
  sanitizePurchaseRecords,
} from '../../adapters/finance/finance.adapter';
import { FINANCE_MAX_RECORDS, financeStorageKey } from '../../constants/finance.constants';
import type {
  CashMovement,
  CreateCashMovementPayload,
  CreateExpensePayload,
  CreatePurchasePayload,
  ExpenseRecord,
  FinanceMutationResult,
  PurchaseRecord,
} from '../../models/finance.model';
import type { FinanceState } from './finance.state';

const initialState: FinanceState = {
  purchases: [],
  expenses: [],
  cash: [],
};

function readStored<T>(storageKey: string, sanitize: (value: unknown) => T[]): T[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitize(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage no disponible: los registros viven solo en memoria.
  }
}

/**
 * Compras, gastos y caja del workspace de empresa (ADR-66). Los registros se
 * persisten por tenant en `localStorage`; los totales viven en `withComputed`
 * y la página solo consume señales (`R-ST-3`).
 */
export const FinanceStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    summary: computed(() =>
      computeFinanceSummary(store.purchases(), store.expenses(), store.cash()),
    ),
    hasPurchases: computed(() => store.purchases().length > 0),
    hasExpenses: computed(() => store.expenses().length > 0),
    hasCash: computed(() => store.cash().length > 0),
  })),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addPurchase(payload: CreatePurchasePayload): FinanceMutationResult {
      if (store.purchases().length >= FINANCE_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de compras locales.' };
      }
      const record = createPurchaseRecord(payload);
      if (!record) {
        return {
          ok: false,
          message: 'Revisa fecha, proveedor, concepto e importe de la compra.',
        };
      }
      patchState(store, { purchases: [record, ...store.purchases()] });
      notificationService.showSuccess('Compra registrada.');
      return { ok: true };
    },

    addExpense(payload: CreateExpensePayload): FinanceMutationResult {
      if (store.expenses().length >= FINANCE_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de gastos locales.' };
      }
      const record = createExpenseRecord(payload);
      if (!record) {
        return {
          ok: false,
          message: 'Revisa fecha, descripción e importe del gasto.',
        };
      }
      patchState(store, { expenses: [record, ...store.expenses()] });
      notificationService.showSuccess('Gasto registrado.');
      return { ok: true };
    },

    addCashMovement(payload: CreateCashMovementPayload): FinanceMutationResult {
      if (store.cash().length >= FINANCE_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de movimientos de caja.' };
      }
      const record = createCashMovement(payload);
      if (!record) {
        return {
          ok: false,
          message: 'Revisa fecha, concepto e importe del movimiento.',
        };
      }
      patchState(store, { cash: [record, ...store.cash()] });
      notificationService.showSuccess('Movimiento de caja registrado.');
      return { ok: true };
    },

    removePurchase(id: string): void {
      patchState(store, {
        purchases: store.purchases().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Compra eliminada.');
    },

    removeExpense(id: string): void {
      patchState(store, {
        expenses: store.expenses().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Gasto eliminado.');
    },

    removeCashMovement(id: string): void {
      patchState(store, {
        cash: store.cash().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Movimiento eliminado.');
    },
  })),
  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);
      const tenantId = authStore.user()?.tenantId;
      const purchaseKey = financeStorageKey('purchases', tenantId);
      const expenseKey = financeStorageKey('expenses', tenantId);
      const cashKey = financeStorageKey('cash', tenantId);

      const purchases = readStored<PurchaseRecord>(purchaseKey, sanitizePurchaseRecords);
      const expenses = readStored<ExpenseRecord>(expenseKey, sanitizeExpenseRecords);
      const cash = readStored<CashMovement>(cashKey, sanitizeCashMovements);
      if (purchases.length > 0) patchState(store, { purchases });
      if (expenses.length > 0) patchState(store, { expenses });
      if (cash.length > 0) patchState(store, { cash });

      effect(() => persist(purchaseKey, store.purchases()));
      effect(() => persist(expenseKey, store.expenses()));
      effect(() => persist(cashKey, store.cash()));
    },
  }),
);
