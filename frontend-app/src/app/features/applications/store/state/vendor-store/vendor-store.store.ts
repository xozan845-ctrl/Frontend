import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { STORE_REPOSITORY } from '../../../onboarding/public-api';
import type { Store } from '../../../shop/public-api';
import type { VendorStoreState } from './vendor-store.state';

const initialState: VendorStoreState = {
  store: null,
  loading: false,
  loaded: false,
  error: null,
};

/**
 * Ficha de la tienda del vendedor (`GET /vendedores/me/tienda`, ADR-31).
 * Store de feature provisto en la ruta; la página solo consume su estado.
 */
export const VendorStoreStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      storeRepo = inject(STORE_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const load = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            storeRepo.getMyStore().pipe(
              tap((tienda) =>
                patchState(store, { store: tienda, loading: false, loaded: true, error: null }),
              ),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar tu tienda.';
                patchState(store, { loading: false, loaded: true, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        /** Carga la ficha de la tienda (o `null` si aún no existe). */
        load,

        /** Reintenta la carga. */
        refresh(): void {
          load();
        },

        /** Refleja una tienda actualizada por otra operación (p. ej. el logo). */
        applyStoreUpdate(updated: Store): void {
          patchState(store, { store: updated, loaded: true, error: null });
        },

        /** Limpia el error visible. */
        clearError(): void {
          patchState(store, { error: null });
        },

        /** Reinicia el estado al salir de la pantalla. */
        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
