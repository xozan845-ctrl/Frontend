import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { COMPANY_INVITATION_REPOSITORY } from '../../repositories/company-invitation.repository';
import type {
  AcceptSellerInvitationData,
  PublicSellerInvitation,
} from '../../models/company-invitation.model';
import type { SellerInvitationState } from './seller-invitation.state';

const initialState: SellerInvitationState = {
  invitation: null,
  session: null,
  loading: false,
  accepting: false,
  error: null,
};

/** Estado público de una invitación de vendedor. */
export const SellerInvitationStore = signalStore(
  withState(initialState),
  withMethods((store, repository = inject(COMPANY_INVITATION_REPOSITORY)) => ({
    load: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null, invitation: null })),
        switchMap((token) =>
          repository.getPublic(token).pipe(
            tap((invitation: PublicSellerInvitation) =>
              patchState(store, { invitation, loading: false, error: null }),
            ),
            catchError((err: Error) => {
              patchState(store, {
                loading: false,
                error: err.message || 'La invitación no es válida o expiró.',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    accept: rxMethod<{ token: string; data: AcceptSellerInvitationData }>(
      pipe(
        tap(() => patchState(store, { accepting: true, error: null, session: null })),
        switchMap(({ token, data }) =>
          repository.accept(token, data).pipe(
            tap((session) => patchState(store, { session, accepting: false, error: null })),
            catchError((err: Error) => {
              patchState(store, {
                accepting: false,
                error: err.message || 'No se pudo aceptar la invitación.',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    clearError(): void {
      patchState(store, { error: null });
    },
    invalidate(): void {
      patchState(store, {
        loading: false,
        error: 'La URL de invitación no contiene un token válido.',
      });
    },
  })),
);
