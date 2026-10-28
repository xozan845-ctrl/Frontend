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
import { BARCODES_SCOPE_CONFIG } from '../../../../shared/barcodes/constants/barcodes-config.tokens';
import {
  computeBarcodesSummary,
  createBarcodeLabel,
  sanitizeBarcodeLabels,
} from '../../adapters/barcodes/barcodes.adapter';
import { BARCODES_MAX_RECORDS, barcodesStorageKey } from '../../constants/barcodes.constants';
import type {
  BarcodeLabel,
  BarcodesMutationResult,
  CreateBarcodeLabelPayload,
} from '../../models/barcode.model';
import type { BarcodesState } from './barcodes.state';

const initialState: BarcodesState = {
  labels: [],
};

function readStored(storageKey: string): BarcodeLabel[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeBarcodeLabels(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function persist(storageKey: string, labels: readonly BarcodeLabel[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(labels));
  } catch {
    // Storage no disponible: las etiquetas viven solo en memoria.
  }
}

/**
 * Códigos de barras del workspace activo (ADR-69). El scope decide si son de
 * la empresa o de la tienda; la persistencia se aísla por tenant/tienda.
 */
export const BarcodesStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    summary: computed(() => computeBarcodesSummary(store.labels())),
    hasLabels: computed(() => store.labels().length > 0),
  })),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addLabel(payload: CreateBarcodeLabelPayload): BarcodesMutationResult {
      if (store.labels().length >= BARCODES_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de códigos de barras.' };
      }
      const label = createBarcodeLabel(payload);
      if (!label) {
        return {
          ok: false,
          message: 'Revisa producto, SKU, código, simbología y copias.',
        };
      }
      patchState(store, { labels: [label, ...store.labels()] });
      notificationService.showSuccess('Código de barras registrado.');
      return { ok: true };
    },

    removeLabel(id: string): void {
      patchState(store, {
        labels: store.labels().filter((label) => label.id !== id),
      });
      notificationService.showSuccess('Código de barras eliminado.');
    },
  })),
  withHooks({
    onInit(store) {
      const config = inject(BARCODES_SCOPE_CONFIG);
      const authStore = inject(AuthStore);
      const scopeId =
        config.storageScope === 'company' ? authStore.user()?.tenantId : authStore.user()?.storeId;
      const storageKey = barcodesStorageKey(config.storageScope, scopeId);
      const stored = readStored(storageKey);
      if (stored.length > 0) patchState(store, { labels: stored });

      effect(() => persist(storageKey, store.labels()));
    },
  }),
);
