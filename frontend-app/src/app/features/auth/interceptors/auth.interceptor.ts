import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../state/auth.store';
import { environment } from '../../../../environments/environment';

/** Endpoints de auth donde un 401 es definitivo (no se reintenta). */
const NO_RETRY = /\/auth\/(login|registro|refresh)$/;

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

      return from(authStore.refreshTokenOnce()).pipe(
        switchMap((renewed) =>
          renewed ? next(withAuth(req, authStore.token())) : throwError(() => error),
        ),
      );
    }),
  );
};
