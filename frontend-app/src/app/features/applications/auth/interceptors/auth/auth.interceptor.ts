import { inject, InjectionToken } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@domains/session/public-api';
import { environment } from '../../../../../../environments/environment';

/**
 * Destinos que pueden recibir el JWT y disparar la renovación de sesión. La
 * composición los selecciona en `app.config.ts`; una lista vacía equivale a no
 * autenticar ningún destino (`R-SE-8`).
 */
export const AUTH_ALLOWED_DESTINATIONS = new InjectionToken<readonly string[]>(
  'AUTH_ALLOWED_DESTINATIONS',
  { factory: () => [] },
);

/** Endpoints de auth donde un 401 es definitivo (no se reintenta). */
const NO_RETRY = /\/auth\/(?:login|registro|refresh)(?:\/)?(?:[?#]|$)/;

/** Origen y ruta normalizados; `origin: ''` identifica una URL relativa. */
function normalizeDestination(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const path = trimmed.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    return { origin: '', path };
  }

  try {
    const url = new URL(trimmed);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
      return null;
    }
    return { origin: url.origin, path: url.pathname.replace(/\/+$/, '') };
  } catch {
    return null;
  }
}

/**
 * Compara origen exacto y ruta con límite de segmento: `/api/v1` no habilita
 * `/api/v10` ni un host que solo comparte el prefijo (`R-SE-8`).
 */
export function isAllowedAuthDestination(url: string, destinations: readonly string[]): boolean {
  const request = normalizeDestination(url);
  if (!request) return false;

  return destinations.some((destination) => {
    const allowed = normalizeDestination(destination);
    if (!allowed || allowed.origin !== request.origin) return false;
    if (!allowed.path) return true;
    return request.path === allowed.path || request.path.startsWith(`${allowed.path}/`);
  });
}

// Evita dos llamadas de refresh aunque varios requests fallen en el mismo
// tick. AuthStore también deduplica su propia operación; esta barrera protege
// el interceptor ante dobles de test y ante stores alternativos (R-SE-1).
let refreshInFlight: Promise<boolean> | null = null;

function refreshSessionOnce(authStore: {
  refreshTokenOnce: () => Promise<boolean>;
}): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = authStore.refreshTokenOnce().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const allowedDestinations = inject(AUTH_ALLOWED_DESTINATIONS);
  const apiConfig = environment.apiConfig;
  const isAuthDestination = isAllowedAuthDestination(req.url, allowedDestinations);

  const withAuth = (
    request: HttpRequest<unknown>,
    token: string | null,
    authenticated: boolean,
  ): HttpRequest<unknown> =>
    authenticated
      ? request.clone({
          headers:
            token && apiConfig?.authType !== 'cookie'
              ? request.headers.set('Authorization', `Bearer ${token}`)
              : request.headers,
          withCredentials: Boolean(apiConfig?.withCredentials || apiConfig?.authType === 'cookie'),
        })
      : request;

  return next(withAuth(req, authStore.token(), isAuthDestination)).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ante 401 de un destino permitido: renueva la sesión y reintenta una
      // sola vez (R-SE-1). Un host ajeno no recibe credenciales ni refresh.
      if (!isAuthDestination || error.status !== 401 || NO_RETRY.test(req.url)) {
        return throwError(() => error);
      }

      return from(refreshSessionOnce(authStore)).pipe(
        switchMap((renewed) =>
          renewed
            ? next(withAuth(req, authStore.token(), isAuthDestination))
            : throwError(() => error),
        ),
      );
    }),
  );
};
