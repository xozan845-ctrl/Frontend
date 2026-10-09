import { inject, effect } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, firstValueFrom, pipe } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { User, LoginCredentials, RegisterData } from '../models/auth.model';
import { AUTH_REPOSITORY } from '../repositories/auth.repository';
import { NotificationService } from '../../../core/services/notification.service';

export interface AuthState {
  user: User | null;
  /** Access token: vive solo en memoria (R-SE-1). */
  token: string | null;
  /** Refresh token: se persiste en sessionStorage (R-SE-1). */
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const REFRESH_STORAGE_KEY = 'ecom_refresh_token';
// Clave heredada (versiones previas guardaban el access token en localStorage).
const LEGACY_AUTH_STORAGE_KEY = 'ecom_auth_data';

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, token }) => ({
    isAuthenticated: () => !!token() && !!user(),
  })),
  withMethods(
    (
      store,
      authService = inject(AUTH_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      // Deduplica renovaciones concurrentes disparadas por 401 (R-SE-1).
      let refreshInFlight: Promise<boolean> | null = null;

      return {
        login: rxMethod<LoginCredentials>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap((credentials) =>
              authService.login(credentials).pipe(
                tap((response) => {
                  patchState(store, {
                    user: response.user,
                    token: response.token ?? null,
                    refreshToken: response.refreshToken ?? null,
                    loading: false,
                  });
                  notificationService.showSuccess(`¡Bienvenido, ${response.user.name}!`);
                }),
                catchError((err: Error) => {
                  const message = err.message || 'Error al iniciar sesión';
                  patchState(store, { error: message, loading: false });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),
        register: rxMethod<RegisterData>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap((userData) =>
              authService.register(userData).pipe(
                tap((response) => {
                  patchState(store, {
                    user: response.user,
                    token: response.token ?? null,
                    refreshToken: response.refreshToken ?? null,
                    loading: false,
                  });
                  notificationService.showSuccess(
                    `¡Cuenta creada exitosamente! Bienvenido, ${response.user.name}`,
                  );
                }),
                catchError((err: Error) => {
                  const message = err.message || 'Error al registrarse';
                  patchState(store, { error: message, loading: false });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),
        logout: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() =>
              authService.logout(store.refreshToken() ?? undefined).pipe(
                tap(() => {
                  patchState(store, {
                    user: null,
                    token: null,
                    refreshToken: null,
                    loading: false,
                  });
                  notificationService.showInfo('Sesión cerrada correctamente');
                }),
                catchError((err: Error) => {
                  patchState(store, {
                    user: null,
                    token: null,
                    refreshToken: null,
                    loading: false,
                    error: err.message || 'Error al cerrar sesión',
                  });
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),
        clearError() {
          patchState(store, { error: null });
        },
        /** Limpia la sesión local sin llamar al backend (p. ej. tras cambiar contraseña). */
        clearSession(): void {
          patchState(store, { user: null, token: null, refreshToken: null, error: null });
        },
        /**
         * Renueva la sesión una vez y devuelve si quedó autenticada (sin tocar
         * `loading`). La usa el interceptor ante un 401 (R-SE-1).
         */
        refreshTokenOnce(): Promise<boolean> {
          if (refreshInFlight) return refreshInFlight;
          const refreshToken = store.refreshToken();
          if (!refreshToken) return Promise.resolve(false);

          refreshInFlight = firstValueFrom(authService.refresh(refreshToken))
            .then((response) => {
              patchState(store, {
                user: response.user,
                token: response.token ?? null,
                refreshToken: response.refreshToken ?? refreshToken,
                error: null,
              });
              return Boolean(response.token);
            })
            .catch((err: Error) => {
              patchState(store, {
                user: null,
                token: null,
                refreshToken: null,
                error: err?.message || 'La sesión expiró',
              });
              return false;
            })
            .finally(() => {
              refreshInFlight = null;
            });
          return refreshInFlight;
        },
      };
    },
  ),
  withHooks({
    onInit(store) {
      try {
        // Purga cualquier access token persistido por versiones anteriores (R-SE-1).
        localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);

        // Restaura la sesión renovando con el refresh token persistido.
        const storedRefresh = sessionStorage.getItem(REFRESH_STORAGE_KEY);
        if (storedRefresh) {
          patchState(store, { refreshToken: storedRefresh });
          void store.refreshTokenOnce();
        }
      } catch (e) {
        console.error('Failed to restore auth session', e);
      }

      // Sincroniza únicamente el refresh token con sessionStorage (R-SE-1).
      effect(() => {
        const refreshToken = store.refreshToken();
        try {
          if (refreshToken) {
            sessionStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
          } else {
            sessionStorage.removeItem(REFRESH_STORAGE_KEY);
          }
        } catch (e) {
          console.error('Failed to persist refresh token', e);
        }
      });
    },
  }),
);
