import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../../state/auth/auth.store';
import { environment } from '../../../../../../environments/environment';

/** Endpoints de auth donde un 401 es definitivo (no se reintenta). */
const NO_RETRY = /\/auth\/(?:login|registro|refresh)(?:\/)?(?:[?#]|$)/;

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
  const apiConfig = environment.apiConfig;

  const withAuth = (request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> =>
    request.clone({
      headers:
        token && apiConfig?.authType !== 'cookie'
          ? request.headers.set('Authorization', `Bearer ${token}`)
          : request.headers,
      withCredentials: Boolean(apiConfig?.withCredentials || apiConfig?.authType === 'cookie'),
    });

  return next(withAuth(req, authStore.token())).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ante 401 fuera de auth: renueva la sesión y reintenta una sola vez
      // (R-SE-1). El reintento también lleva el token renovado.
      if (error.status !== 401 || NO_RETRY.test(req.url)) {
        return throwError(() => error);
      }

      return from(refreshSessionOnce(authStore)).pipe(
        switchMap((renewed) =>
          renewed ? next(withAuth(req, authStore.token())) : throwError(() => error),
        ),
      );
    }),
  );
};
