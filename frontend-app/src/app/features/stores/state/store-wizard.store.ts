import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Store } from '../../products/public-api';
import {
  CatalogProductOption,
  OfferDraft,
  StoreDraft,
  WIZARD_STEPS,
} from '../models/store-wizard.model';
import { STORE_REPOSITORY } from '../repositories/store.repository';
import { NotificationService } from '../../../core/services/notification.service';

export interface StoreWizardState {
  step: number;
  loading: boolean;
  error: string | null;
  store: Store | null;
  catalog: CatalogProductOption[];
  catalogLoading: boolean;
  publishedCount: number;
}

const initialState: StoreWizardState = {
  step: 1,
  loading: false,
  error: null,
  store: null,
  catalog: [],
  catalogLoading: false,
  publishedCount: 0,
};

/**
 * Estado del asistente de creación de tienda (R-AR-5). Es un store **de feature**
 * (no `root`): se provee en la ruta para que cada visita empiece limpia.
 */
export const StoreWizardStore = signalStore(
  withState(initialState),
  withComputed(({ step }) => ({
    totalSteps: () => WIZARD_STEPS.length,
    isFirstStep: () => step() === 1,
    isLastStep: () => step() === WIZARD_STEPS.length,
  })),
  withMethods(
    (
      store,
      repo = inject(STORE_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      setStep(step: number): void {
        patchState(store, { step, error: null });
      },
      next(): void {
        patchState(store, { step: Math.min(store.step() + 1, WIZARD_STEPS.length), error: null });
      },
      back(): void {
        patchState(store, { step: Math.max(store.step() - 1, 1), error: null });
      },
      reset(): void {
        patchState(store, initialState);
      },
      /** Crea la tienda y avanza al paso de productos. */
      async createStore(draft: StoreDraft): Promise<boolean> {
        patchState(store, { loading: true, error: null });
        try {
          const created = await firstValueFrom(repo.createStore(draft));
          patchState(store, { store: created, loading: false, step: 3 });
          notificationService.showSuccess(`Tienda "${created.name}" creada.`);
          return true;
        } catch (err) {
          const message = (err as Error).message || 'No se pudo crear la tienda.';
          patchState(store, { loading: false, error: message });
          notificationService.showError(message);
          return false;
        }
      },
      /** Carga el catálogo para elegir productos a ofertar. */
      loadCatalog(): void {
        patchState(store, { catalogLoading: true, error: null });
        repo.listCatalog().subscribe({
          next: (catalog) => patchState(store, { catalog, catalogLoading: false }),
          error: (err: Error) => {
            const message = err.message || 'No se pudo cargar el catálogo.';
            patchState(store, { catalogLoading: false, error: message });
            notificationService.showError(message);
          },
        });
      },
      /** Publica las ofertas elegidas y avanza a "Listo". */
      async publishOffers(offers: OfferDraft[]): Promise<boolean> {
        if (offers.length === 0) {
          patchState(store, { step: 4, publishedCount: 0, error: null });
          return true;
        }
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(forkJoin(offers.map((offer) => repo.publishOffer(offer))));
          patchState(store, { loading: false, publishedCount: offers.length, step: 4 });
          notificationService.showSuccess(`${offers.length} producto(s) publicado(s).`);
          return true;
        } catch (err) {
          const message = (err as Error).message || 'No se pudieron publicar los productos.';
          patchState(store, { loading: false, error: message });
          notificationService.showError(message);
          return false;
        }
      },
    }),
  ),
);
