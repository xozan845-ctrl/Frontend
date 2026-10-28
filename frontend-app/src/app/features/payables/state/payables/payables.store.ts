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
  computePayablesSummary,
  createPayableRecord,
  isPayableOverdue,
  sanitizePayableRecords,
  todayDate,
} from '../../adapters/payables/payables.adapter';
import { PAYABLES_SCOPE_CONFIG } from '../../../../shared/payables/constants/payables-config.tokens';
import { PAYABLES_MAX_RECORDS, payablesStorageKey } from '../../constants/payables.constants';
import type {
  CreatePayablePayload,
  PayableRecord,
  PayablesMutationResult,
} from '../../models/payables.model';
import type { PayablesState } from './payables.state';

const initialState: PayablesState = {
  records: [],
};

function readStored(storageKey: string): PayableRecord[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizePayableRecords(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, records: readonly PayableRecord[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    // Storage no disponible: las cuentas viven solo en memoria.
  }
}

/**
 * Cuentas por pagar del workspace activo (ADR-67). El scope decide si los
 * datos son de la empresa o de la tienda del vendedor; el almacenamiento se
 * aísla por tenant/tienda y los totales viven en `withComputed`.
 */
export const PayablesStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    rows: computed(() => {
      const today = todayDate();
      return store.records().map((record) => ({
        ...record,
        overdue: isPayableOverdue(record, today),
      }));
    }),
    summary: computed(() => computePayablesSummary(store.records())),
    hasRecords: computed(() => store.records().length > 0),
  })),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addPayable(payload: CreatePayablePayload): PayablesMutationResult {
      if (store.records().length >= PAYABLES_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de cuentas por pagar.' };
      }
      const record = createPayableRecord(payload);
      if (!record) {
        return { ok: false, message: 'Revisa proveedor, concepto, vencimiento e importe.' };
      }
      patchState(store, { records: [record, ...store.records()] });
      notificationService.showSuccess('Cuenta por pagar registrada.');
      return { ok: true };
    },

    markPaid(id: string): void {
      const paidAt = todayDate();
      patchState(store, {
        records: store
          .records()
          .map((record) => (record.id === id ? { ...record, status: 'pagada', paidAt } : record)),
      });
      notificationService.showSuccess('Cuenta marcada como pagada.');
    },

    removePayable(id: string): void {
      patchState(store, {
        records: store.records().filter((record) => record.id !== id),
      });
      notificationService.showSuccess('Cuenta por pagar eliminada.');
    },
  })),
  withHooks({
    onInit(store) {
      const config = inject(PAYABLES_SCOPE_CONFIG);
      const authStore = inject(AuthStore);
      const scopeId =
        config.storageScope === 'company' ? authStore.user()?.tenantId : authStore.user()?.storeId;
      const storageKey = payablesStorageKey(config.storageScope, scopeId);
      const stored = readStored(storageKey);
      if (stored.length > 0) patchState(store, { records: stored });

      effect(() => persist(storageKey, store.records()));
    },
  }),
);
