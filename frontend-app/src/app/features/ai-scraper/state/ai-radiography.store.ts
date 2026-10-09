import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {
  AiLearnedProfile,
  AiRadiographyInput,
  AiRadiographyResult,
} from '../models/ai-radiography.model';
import { AI_RADIOGRAPHY_REPOSITORY } from '../repositories/ai-radiography.repository';
import { NotificationService } from '../../../core/services/notification.service';

export interface AiRadiographyState {
  running: boolean;
  result: AiRadiographyResult | null;
  error: string | null;
  profile: AiLearnedProfile | null;
  profileLoading: boolean;
}

const initialState: AiRadiographyState = {
  running: false,
  result: null,
  error: null,
  profile: null,
  profileLoading: false,
};

/** Estado de radiografía / memoria de sitios (`R-AR-5`). */
export const AiRadiographyStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      radiographyRepo = inject(AI_RADIOGRAPHY_REPOSITORY),
      notification = inject(NotificationService),
    ) => {
      const run = rxMethod<AiRadiographyInput>(
        pipe(
          tap(() => patchState(store, { running: true, error: null, result: null, profile: null })),
          switchMap((input) =>
            radiographyRepo.run(input).pipe(
              tap((result) => {
                patchState(store, { running: false, result });
                notification.showSuccess(`Radiografía completada: ${result.discovered} páginas.`);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo completar la radiografía.';
                patchState(store, { running: false, error: message });
                notification.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const loadProfile = rxMethod<string>(
        pipe(
          tap(() => patchState(store, { profileLoading: true, profile: null })),
          switchMap((domain) =>
            radiographyRepo.getLearnedProfile(domain).pipe(
              tap((profile) => patchState(store, { profile, profileLoading: false })),
              catchError((err: Error) => {
                patchState(store, { profileLoading: false, error: err.message });
                notification.showError(err.message || 'No se pudo cargar el perfil del dominio.');
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return { run, loadProfile };
    },
  ),
);
