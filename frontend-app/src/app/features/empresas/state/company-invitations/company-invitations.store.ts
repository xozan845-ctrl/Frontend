import { computed, inject, untracked } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import type {
  CreateSellerInvitationData,
  SellerInvitation,
} from '../../models/company-invitation.model';
import { COMPANY_INVITATION_REPOSITORY } from '../../repositories/company-invitation.repository';
import type { CompanyInvitationsState } from './company-invitations.state';

const initialState: CompanyInvitationsState = {
  sellers: [],
  invitations: [],
  lastInvitation: null,
  loading: false,
  saving: false,
  error: null,
};

/** Estado de vendedores e invitaciones del workspace empresarial. */
export const CompanyInvitationsStore = signalStore(
  withState(initialState),
  withComputed(({ invitations }) => ({
    /** Enlaces todavía utilizables; el resto pasa al historial. */
    pendingInvitations: computed(() =>
      invitations().filter((invitation) => invitation.status === 'pendiente'),
    ),
    pastInvitations: computed(() =>
      invitations().filter((invitation) => invitation.status !== 'pendiente'),
    ),
  })),
  withMethods(
    (
      store,
      repository = inject(COMPANY_INVITATION_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      load: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((companyId) =>
            repository.list(companyId).pipe(
              tap((snapshot) =>
                patchState(store, {
                  sellers: snapshot.sellers,
                  invitations: snapshot.invitations,
                  loading: false,
                  error: null,
                }),
              ),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar los vendedores.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      createInvitation: rxMethod<{ companyId: string; data: CreateSellerInvitationData }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null, lastInvitation: null })),
          switchMap(({ companyId, data }) =>
            repository.create(companyId, data).pipe(
              tap((invitation: SellerInvitation) => {
                patchState(store, {
                  lastInvitation: invitation,
                  saving: false,
                  error: null,
                  invitations: [
                    ...untracked(() => store.invitations()),
                    {
                      id: invitation.id,
                      email: invitation.email,
                      storeId: invitation.storeId,
                      storeName: invitation.storeName,
                      participationPercentage: invitation.participationPercentage,
                      status: invitation.status,
                      expiresAt: invitation.expiresAt,
                    },
                  ],
                });
                notificationService.showSuccess('Invitación generada. Ya puedes compartirla.');
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo generar la invitación.';
                patchState(store, { saving: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      revokeInvitation: rxMethod<{ companyId: string; invitationId: string }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          switchMap(({ companyId, invitationId }) =>
            repository.revoke(companyId, invitationId).pipe(
              tap(() => {
                patchState(store, {
                  invitations: untracked(() => store.invitations()).filter(
                    (invitation) => invitation.id !== invitationId,
                  ),
                  saving: false,
                  error: null,
                });
                notificationService.showSuccess('Invitación revocada.');
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo revocar la invitación.';
                patchState(store, { saving: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      clearError(): void {
        patchState(store, { error: null });
      },

      clearLastInvitation(): void {
        patchState(store, { lastInvitation: null });
      },

      reset(): void {
        patchState(store, initialState);
      },
    }),
  ),
);
