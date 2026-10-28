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
import { BANKS_SCOPE_CONFIG } from '../../../../shared/banks/constants/banks-config.tokens';
import {
  computeBanksSummary,
  createBankAccount,
  sanitizeBankAccounts,
  updateBankAccount,
} from '../../adapters/banks/banks.adapter';
import { BANKS_MAX_RECORDS, banksStorageKey } from '../../constants/banks.constants';
import type {
  BankAccount,
  BanksMutationResult,
  CreateBankAccountPayload,
} from '../../models/bank.model';
import type { BanksState } from './banks.state';

const initialState: BanksState = {
  accounts: [],
};

function readStored(storageKey: string): BankAccount[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeBankAccounts(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, accounts: readonly BankAccount[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(accounts));
  } catch {
    // Storage no disponible: las cuentas viven solo en memoria.
  }
}

/**
 * Cuentas bancarias del workspace activo (ADR-68). El scope decide si los
 * datos son de la empresa o de la tienda del vendedor; el saldo total vive en
 * `withComputed` y la persistencia se aísla por tenant/tienda.
 */
export const BanksStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    summary: computed(() => computeBanksSummary(store.accounts())),
    hasAccounts: computed(() => store.accounts().length > 0),
  })),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addAccount(payload: CreateBankAccountPayload): BanksMutationResult {
      if (store.accounts().length >= BANKS_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de cuentas bancarias.' };
      }
      const account = createBankAccount(payload);
      if (!account) {
        return { ok: false, message: 'Revisa banco, alias, número y saldo de la cuenta.' };
      }
      patchState(store, { accounts: [account, ...store.accounts()] });
      notificationService.showSuccess('Cuenta bancaria registrada.');
      return { ok: true };
    },

    updateAccount(id: string, payload: CreateBankAccountPayload): BanksMutationResult {
      const current = store.accounts().find((account) => account.id === id);
      if (!current) return { ok: false, message: 'La cuenta bancaria no existe.' };
      const account = updateBankAccount(current, payload);
      if (!account) {
        return { ok: false, message: 'Revisa banco, alias, número y saldo de la cuenta.' };
      }
      patchState(store, {
        accounts: store.accounts().map((item) => (item.id === id ? account : item)),
      });
      notificationService.showSuccess('Cuenta bancaria actualizada.');
      return { ok: true };
    },

    removeAccount(id: string): void {
      patchState(store, {
        accounts: store.accounts().filter((account) => account.id !== id),
      });
      notificationService.showSuccess('Cuenta bancaria eliminada.');
    },
  })),
  withHooks({
    onInit(store) {
      const config = inject(BANKS_SCOPE_CONFIG);
      const authStore = inject(AuthStore);
      const scopeId =
        config.storageScope === 'company' ? authStore.user()?.tenantId : authStore.user()?.storeId;
      const storageKey = banksStorageKey(config.storageScope, scopeId);
      const stored = readStored(storageKey);
      if (stored.length > 0) patchState(store, { accounts: stored });

      effect(() => persist(storageKey, store.accounts()));
    },
  }),
);
