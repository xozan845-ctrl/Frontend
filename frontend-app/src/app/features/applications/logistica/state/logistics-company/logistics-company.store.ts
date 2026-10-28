import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, defer, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { LOGISTICS_COMPANY_REPOSITORY } from '../../repositories/logistics-company.repository';
import type { CreateLogisticsCompanyData } from '../../models/logistics-company.model';
import type { LogisticsCompanyState } from './logistics-company.state';

const initialState: LogisticsCompanyState = { company: null, saving: false, error: null };

export const LogisticsCompanyStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      repository = inject(LOGISTICS_COMPANY_REPOSITORY),
      authStore = inject(AuthStore),
      notification = inject(NotificationService),
    ) => ({
      create: rxMethod<CreateLogisticsCompanyData>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          switchMap((data) =>
            defer(() => repository.create(data)).pipe(
              tap((company) => {
                patchState(store, { company, saving: false });
                authStore.setLogisticsCompanyContext(company.id, 'owner');
                notification.showSuccess(`Empresa logística "${company.name}" creada.`);
              }),
              catchError((error: Error) => {
                patchState(store, { saving: false, error: error.message });
                notification.showError(error.message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      clearError(): void {
        patchState(store, { error: null });
      },
    }),
  ),
);
