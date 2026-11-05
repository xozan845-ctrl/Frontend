import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { toUserMessage } from '../../../../../core/models/api-error';
import type { MediaBackgroundConfig } from '../../../../../core/models/media-background.model';
import { MEDIA_BACKGROUND_REPOSITORY } from '../../repositories/media-background.repository';
import type { MediaBackgroundState } from './media-background.state';

const initialState: MediaBackgroundState = {
  platform: null,
  panelAi: null,
  company: null,
  store: null,
  platformLoaded: false,
  panelAiLoaded: false,
  companyLoadedId: null,
  storeLoadedId: null,
  loadingPlatform: false,
  loadingPanelAi: false,
  loadingCompany: false,
  loadingStore: false,
  error: null,
};

const LOAD_ERROR = 'No se pudo cargar el fondo multimedia.';

/**
 * Estado transversal de fondos multimedia (`background_*`). Mantiene una
 * ranura por ámbito para que una misma pantalla pueda combinar, por ejemplo,
 * fondo de plataforma y de empresa. Los consumidores eligen el que aplique;
 * el componente compartido solo recibe la configuración ya normalizada.
 */
export const MediaBackgroundStore = signalStore(
  withState(initialState),
  withMethods((store, repo = inject(MEDIA_BACKGROUND_REPOSITORY)) => ({
    /** Carga el fondo configurado para la plataforma (público, una vez). */
    loadPlatform: rxMethod<void>(
      pipe(
        filter(() => !store.platformLoaded()),
        tap(() => patchState(store, { loadingPlatform: true, error: null })),
        switchMap(() =>
          repo.platform().pipe(
            tap((config) =>
              patchState(store, {
                platform: config,
                platformLoaded: true,
                loadingPlatform: false,
                error: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                loadingPlatform: false,
                error: toUserMessage(error, LOAD_ERROR),
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    /** Carga el fondo del panel de IA (global, una vez). */
    loadPanelAi: rxMethod<void>(
      pipe(
        filter(() => !store.panelAiLoaded()),
        tap(() => patchState(store, { loadingPanelAi: true, error: null })),
        switchMap(() =>
          repo.panelAi().pipe(
            tap((config) =>
              patchState(store, {
                panelAi: config,
                panelAiLoaded: true,
                loadingPanelAi: false,
                error: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                loadingPanelAi: false,
                error: toUserMessage(error, LOAD_ERROR),
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    /** Aplica el fondo de plataforma devuelto por un PATCH. */
    setPlatform(config: MediaBackgroundConfig): void {
      patchState(store, { platform: config, platformLoaded: true, error: null });
    },

    /** Aplica el fondo del panel de IA devuelto por un PATCH. */
    setPanelAi(config: MediaBackgroundConfig): void {
      patchState(store, { panelAi: config, panelAiLoaded: true, error: null });
    },

    /** Carga el fondo de una empresa; repite solo si cambia el id. */
    loadCompany: rxMethod<string>(
      pipe(
        filter((companyId) => !!companyId && store.companyLoadedId() !== companyId),
        tap(() => patchState(store, { loadingCompany: true, error: null })),
        switchMap((companyId) =>
          repo.company(companyId).pipe(
            tap((config) =>
              patchState(store, {
                company: config,
                companyLoadedId: companyId,
                loadingCompany: false,
                error: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                loadingCompany: false,
                error: toUserMessage(error, LOAD_ERROR),
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    /** Carga el fondo público de una tienda; repite solo si cambia el id. */
    loadStore: rxMethod<string>(
      pipe(
        filter((storeId) => !!storeId && store.storeLoadedId() !== storeId),
        tap(() => patchState(store, { loadingStore: true, error: null })),
        switchMap((storeId) =>
          repo.store(storeId).pipe(
            tap((config) =>
              patchState(store, {
                store: config,
                storeLoadedId: storeId,
                loadingStore: false,
                error: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                loadingStore: false,
                error: toUserMessage(error, LOAD_ERROR),
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

    /** Descarta los fondos cargados (p. ej. al cambiar de sesión). */
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
