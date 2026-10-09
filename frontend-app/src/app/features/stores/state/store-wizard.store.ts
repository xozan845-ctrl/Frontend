import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, of, pipe, Observable } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Store } from '../../products/public-api';
import {
  CatalogProductOption,
  OfferDraft,
  StoreDraft,
  WIZARD_STEPS,
} from '../models/store-wizard.model';
import { STORE_REPOSITORY } from '../repositories/store.repository';
import { CATALOG_REPOSITORY } from '../repositories/catalog.repository';
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
 * Las operaciones de aplicación son métodos con nombre de dominio (`R-CX-5`) y
 * hablan con la infraestructura por puertos separados (`R-SO-4`); el HTTP se
 * orquesta con `rxMethod` y se libera con el store (`R-ST-5`, `R-AR-10`).
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
      storeRepo = inject(STORE_REPOSITORY),
      catalogRepo = inject(CATALOG_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const loadCatalog = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { catalogLoading: true, error: null })),
          switchMap(() =>
            catalogRepo.listCatalog().pipe(
              tap((catalog) => patchState(store, { catalog, catalogLoading: false })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el catálogo.';
                patchState(store, { catalogLoading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        /** (Re)carga el catálogo global para ofertar productos. */
        loadCatalog,

        /** Avanza al paso de datos de la tienda (p. ej. vendedor ya autenticado). */
        goToStoreStep(): void {
          patchState(store, { step: 2, error: null });
        },

        /**
         * Avanza del paso de cuenta al de tienda cuando ya hay sesión de
         * vendedor; la regla vive en el store, no en el componente (`R-CX-3`).
         */
        startForSeller(isSeller: boolean): void {
          if (isSeller && store.step() === 1) {
            patchState(store, { step: 2, error: null });
          }
        },

        /** Avanza al paso de productos y dispara la carga del catálogo (`R-CX-3`). */
        goToProductsStep(): void {
          patchState(store, { step: 3, error: null });
          loadCatalog();
        },

        /** Retrocede un paso del asistente. */
        goBack(): void {
          patchState(store, { step: Math.max(store.step() - 1, 1), error: null });
        },

        /** Reinicia el asistente a su estado inicial. */
        reset(): void {
          patchState(store, initialState);
        },

        /** Crea la tienda y, al lograrlo, avanza al paso de productos. */
        createStore: rxMethod<StoreDraft>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap((draft) =>
              storeRepo.createStore(draft).pipe(
                tap((created) => {
                  patchState(store, { store: created, loading: false, step: 3, error: null });
                  notificationService.showSuccess(`Tienda "${created.name}" creada.`);
                  loadCatalog();
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo crear la tienda.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Publica las ofertas elegidas y avanza a "Listo". */
        publishOffers: rxMethod<OfferDraft[]>(
          pipe(
            tap((offers) => patchState(store, { loading: offers.length > 0, error: null })),
            switchMap((offers) => {
              const source$: Observable<unknown> =
                offers.length === 0
                  ? of<unknown>(null)
                  : forkJoin(offers.map((offer) => storeRepo.publishOffer(offer)));
              return source$.pipe(
                tap(() => {
                  patchState(store, {
                    loading: false,
                    publishedCount: offers.length,
                    step: 4,
                    error: null,
                  });
                  if (offers.length > 0) {
                    notificationService.showSuccess(`${offers.length} producto(s) publicado(s).`);
                  }
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudieron publicar los productos.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
      };
    },
  ),
);
