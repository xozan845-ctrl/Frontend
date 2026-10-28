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
import { CREDITS_SCOPE_CONFIG } from '../../../../../shared/credits/constants/credits-config.tokens';
import {
  computeCreditsSummary,
  createCreditRecord,
  isCreditOverdue,
  isCreditPaid,
  sanitizeCreditRecords,
  todayDate,
} from '../../adapters/credits/credits.adapter';
import { CREDITS_MAX_RECORDS, creditsStorageKey } from '../../constants/credits.constants';
import type {
  CreateCreditPayload,
  CreditRecord,
  CreditsMutationResult,
} from '../../models/credit.model';
import type { CreditsState } from './credits.state';

const initialState: CreditsState = {
  records: [],
};

function readStored(storageKey: string): CreditRecord[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeCreditRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, records: readonly CreditRecord[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    // Storage no disponible: los créditos viven solo en memoria.
  }
}

/**
 * Créditos del workspace activo (ADR-70). El scope decide si son de la empresa
 * o de la tienda; el saldo, vencimiento y cobros se derivan en `withComputed`.
 */
export const CreditsStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    rows: computed(() => {
      const today = todayDate();
      return store.records().map((record) => ({
        ...record,
        overdue: isCreditOverdue(record, today),
        paid: isCreditPaid(record),
      }));
    }),
    summary: computed(() => computeCreditsSummary(store.records())),
    hasRecords: computed(() => store.records().length > 0),
  })),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addCredit(payload: CreateCreditPayload): CreditsMutationResult {
      if (store.records().length >= CREDITS_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de créditos.' };
      }
      const record = createCreditRecord(payload);
      if (!record) {
        return { ok: false, message: 'Revisa cliente, concepto, vencimiento e importe.' };
      }
      patchState(store, { records: [record, ...store.records()] });
      notificationService.showSuccess('Crédito registrado.');
      return { ok: true };
    },

    markPaid(id: string): void {
      patchState(store, {
        records: store
          .records()
          .map((record) => (record.id === id ? { ...record, balance: 0 } : record)),
      });
      notificationService.showSuccess('Crédito marcado como pagado.');
    },

    removeCredit(id: string): void {
      patchState(store, {
        records: store.records().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Crédito eliminado.');
    },
  })),
  withHooks({
    onInit(store) {
      const config = inject(CREDITS_SCOPE_CONFIG);
      const authStore = inject(AuthStore);
      const scopeId =
        config.storageScope === 'company' ? authStore.user()?.tenantId : authStore.user()?.storeId;
      const storageKey = creditsStorageKey(config.storageScope, scopeId);
      const stored = readStored(storageKey);
      if (stored.length > 0) patchState(store, { records: stored });

      effect(() => persist(storageKey, store.records()));
    },
  }),
);
