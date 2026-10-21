import { inject, untracked } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { UpdateOfferMarginData } from '../../models/vendor-offer.model';
import { VENDOR_OFFER_REPOSITORY } from '../../repositories/vendor-offer.repository';
import type { VendorOffersState } from '../vendor.state';

const initialState: VendorOffersState = {
  offers: [],
  total: 0,
  page: 1,
  limit: 20,
  pages: 1,
  loading: false,
  savingId: null,
  error: null,
};

/**
 * Ofertas del vendedor (ADR-29): lista paginada desde
 * `GET /vendedores/me/ofertas` y edición de margen con
 * `PATCH /vendedores/productos/:id`. La página solo consume este store.
 */
export const VendorOffersStore = signalStore(
  withState(initialState),
  withComputed(({ page, pages, offers }) => ({
    isFirstPage: () => page() <= 1,
    isLastPage: () => page() >= pages(),
    hasOffers: () => offers().length > 0,
  })),
  withMethods(
    (
      store,
      offerRepo = inject(VENDOR_OFFER_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const loadPage = rxMethod<number>(
        pipe(
          tap((page) => patchState(store, { loading: true, error: null, page })),
          switchMap((page) =>
            offerRepo
              .listOffers(
                page,
                untracked(() => store.limit()),
              )
              .pipe(
                tap((result) =>
                  patchState(store, {
                    offers: result.items,
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: result.pages,
                    loading: false,
                    error: null,
                  }),
                ),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudieron cargar tus ofertas.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
          ),
        ),
      );

      return {
        /** Carga una página (1-based). */
        loadPage,

        /** Recarga la página actual (reintento o tras editar). */
        refresh(): void {
          loadPage(untracked(() => store.page()));
        },

        /** Cambia el margen de una oferta y actualiza la fila en memoria. */
        updateMargin: rxMethod<UpdateOfferMarginData>(
          pipe(
            tap(({ offerId }) => patchState(store, { savingId: offerId, error: null })),
            switchMap(({ offerId, margin }) =>
              offerRepo.updateMargin(offerId, margin).pipe(
                tap((updated) => {
                  patchState(store, {
                    offers: untracked(() => store.offers()).map((offer) =>
                      offer.id === updated.id ? updated : offer,
                    ),
                    savingId: null,
                    error: null,
                  });
                  notificationService.showSuccess('Margen actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el margen.';
                  patchState(store, { savingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

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
