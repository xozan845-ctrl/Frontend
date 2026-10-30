import { inject, untracked } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, from, of, pipe, Observable, throwError } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { AuthStore } from '../../../auth/public-api';
import { COMPANY_REPOSITORY } from '../../../empresas/public-api';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../products/public-api';
import { STORAGE_REPOSITORY } from '../../../storage/public-api';
import {
  CreateStoreProductDraft,
  OfferDraft,
  StoreCompanySetup,
  StoreDraft,
  WIZARD_STEPS,
} from '../../models/store-wizard.model';
import { STORE_REPOSITORY } from '../../repositories/store.repository';
import { CATALOG_REPOSITORY } from '../../repositories/catalog.repository';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import type { StoreWizardState } from './store-wizard.state';

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
      companyRepo = inject(COMPANY_REPOSITORY),
      catalogProductRepo = inject(CATALOG_PRODUCT_REPOSITORY),
      storageRepo = inject(STORAGE_REPOSITORY),
      authStore = inject(AuthStore),
      notificationService = inject(NotificationService),
    ) => {
      /** Sube y asocia el logo de la empresa recién creada. */
      const uploadCompanyLogo = (companyId: string, file: File): Observable<void> =>
        storageRepo
          .requestUpload({
            name: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            folder: 'empresa/logo',
            description: 'Logo de la empresa',
          })
          .pipe(
            switchMap((upload) =>
              storageRepo
                .uploadToUrl(upload.uploadUrl, upload.headers, file)
                .pipe(map(() => upload.objectId)),
            ),
            switchMap((objectId) => storageRepo.confirm(objectId)),
            switchMap((object) =>
              companyRepo.updateProfile(companyId, { logoObjectId: object.id }),
            ),
            map(() => undefined),
          );

      /**
       * Crea la empresa del empresario y renueva la sesión para que el JWT
       * lleve el `tenant_id` que exige `POST /vendedores/tienda`.
       */
      const setupCompany = (company: StoreCompanySetup): Observable<void> =>
        companyRepo
          .create({
            name: company.name,
            logisticsMode: company.logisticsMode,
            ...(company.type ? { type: company.type } : {}),
          })
          .pipe(
            switchMap((created) =>
              company.logoFile
                ? uploadCompanyLogo(created.id, company.logoFile).pipe(
                    catchError((err: Error) => {
                      notificationService.showError(
                        err.message || 'La empresa se creó, pero el logo no se pudo subir.',
                      );
                      return of(undefined);
                    }),
                  )
                : of(undefined),
            ),
            switchMap(() => from(authStore.refreshTokenOnce())),
            switchMap((renewed) =>
              renewed
                ? of(undefined)
                : throwError(
                    () =>
                      new Error(
                        'La empresa se creó, pero la sesión no se pudo renovar. Inicia sesión de nuevo.',
                      ),
                  ),
            ),
          );

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

        /** Crea la empresa (si falta) y la tienda, y avanza al paso de productos. */
        createStore: rxMethod<StoreDraft>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap((draft) => {
              const needsCompany = !!draft.company && !untracked(() => authStore.user()?.tenantId);
              const company$: Observable<void> =
                needsCompany && draft.company ? setupCompany(draft.company) : of(undefined);

              return company$.pipe(
                switchMap(() =>
                  storeRepo.createStore({ name: draft.name, description: draft.description }),
                ),
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
              );
            }),
          ),
        ),

        /** Publica las ofertas elegidas y avanza a "Listo". */
        publishOffers: rxMethod<OfferDraft[]>(
          pipe(
            tap((offers) => patchState(store, { loading: offers.length > 0, error: null })),
            switchMap((offers) => {
              const storeId = untracked(() => store.store())?.id;
              if (offers.length > 0 && !storeId) {
                const message = 'Primero crea tu tienda.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }

              const source$: Observable<unknown> =
                offers.length === 0
                  ? of<unknown>(null)
                  : forkJoin(offers.map((offer) => storeRepo.publishOffer(storeId!, offer)));
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

        /** Crea productos maestros y los publica como ofertas de la tienda. */
        createAndPublishProducts: rxMethod<CreateStoreProductDraft[]>(
          pipe(
            tap((products) => patchState(store, { loading: products.length > 0, error: null })),
            switchMap((drafts) => {
              const storeId = untracked(() => store.store())?.id;
              if (drafts.length === 0) {
                patchState(store, { loading: false, error: 'Agrega al menos un producto.' });
                return EMPTY;
              }
              if (!storeId) {
                const message = 'Primero crea tu tienda.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }

              return forkJoin(
                drafts.map(({ margin: _margin, ...product }) => catalogProductRepo.create(product)),
              ).pipe(
                switchMap((products) =>
                  forkJoin(
                    products.map((product, index) =>
                      storeRepo.publishOffer(storeId, {
                        productId: product.id,
                        margin: drafts[index].margin,
                      }),
                    ),
                  ).pipe(map(() => products.length)),
                ),
                tap((publishedCount) => {
                  patchState(store, {
                    loading: false,
                    publishedCount,
                    step: 4,
                    error: null,
                  });
                  notificationService.showSuccess(
                    `${publishedCount} producto(s) creado(s) y publicado(s).`,
                  );
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudieron crear los productos.';
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
