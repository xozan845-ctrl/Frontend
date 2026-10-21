import { inject, untracked } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, pipe } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { CLIENT_SEARCH_DEBOUNCE_MS } from '../../constants/vendor.constants';
import { Client, CreateClientPayload } from '../../models/vendor-order.model';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { ClientSearchState } from '../vendor.state';

const initialState: ClientSearchState = {
  query: '',
  results: [],
  loading: false,
  error: null,
  creating: false,
  lastCreated: null,
};

/**
 * Buscador de la cartera de clientes del POS: término con `debounce`, resultados,
 * reintento explícito y alta rápida (`R-PF-6`, `R-ST-5`). Store de feature
 * compartido por el `client-picker` del POS y la página de clientes.
 */
export const ClientSearchStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      clientRepo = inject(CLIENT_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      /** Consulta de cartera compartida por la búsqueda con `debounce` y el reintento. */
      const fetchResults = (query: string): Observable<Client[]> =>
        clientRepo.searchClients(query).pipe(
          tap((results) => patchState(store, { results, loading: false })),
          catchError((err: Error) => {
            const message = err.message || 'No se pudieron cargar los clientes.';
            patchState(store, { loading: false, error: message, results: [] });
            notificationService.showError(message);
            return EMPTY;
          }),
        );

      const search = rxMethod<string>(
        pipe(
          map((query) => query.trim()),
          debounceTime(CLIENT_SEARCH_DEBOUNCE_MS),
          distinctUntilChanged(),
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((query) => fetchResults(query)),
        ),
      );

      /** Reintento explícito: repite la consulta actual aunque el término no cambie. */
      const reloadSearch = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() => fetchResults(untracked(() => store.query()).trim())),
        ),
      );

      return {
        /** Cambia el término de búsqueda y consulta la cartera (con `debounce`). */
        setQuery(query: string): void {
          patchState(store, { query });
          search(query);
        },

        /** Primera carga al entrar a la pantalla: lista los primeros clientes. */
        loadInitial(): void {
          search('');
        },

        /** Repite la consulta actual sin esperar al `debounce` (reintento tras error). */
        reload(): void {
          reloadSearch();
        },

        /** Alta rápida de cliente; el creado queda en `lastCreated` para seleccionarlo. */
        createClient: rxMethod<CreateClientPayload>(
          pipe(
            tap(() => patchState(store, { creating: true, error: null })),
            switchMap((payload) =>
              clientRepo.createClient(payload).pipe(
                tap((client) => {
                  patchState(store, {
                    creating: false,
                    lastCreated: client,
                    // Lectura sin rastreo: el pipe puede correr en contexto reactivo.
                    results: [
                      client,
                      ...untracked(() => store.results()).filter((item) => item.id !== client.id),
                    ],
                  });
                  notificationService.showSuccess(`Cliente ${client.name} creado.`);
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo crear el cliente.';
                  patchState(store, { creating: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** El contenedor confirma que ya seleccionó `lastCreated` (evita re-selección). */
        acknowledgeCreated(): void {
          patchState(store, { lastCreated: null });
        },

        /** Reinicia el buscador a su estado inicial. */
        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
