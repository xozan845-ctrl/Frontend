import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Cliente HTTP del backend de IA (`R-AR-8`): centraliza la URL base
 * (`environment.aiScraperUrl`, `R-AR-11`), la composición de paths y el guard de
 * configuración. Los servicios de cada puerto lo usan; los componentes nunca
 * tocan `HttpClient`.
 */
@Injectable({
  providedIn: 'root',
})
export class AiScraperClient {
  private readonly http = inject(HttpClient);

  get(path: string): Observable<unknown> {
    return this.ensure().pipe(switchMap(() => this.http.get<unknown>(this.url(path))));
  }

  post(path: string, body: unknown, headers?: Record<string, string>): Observable<unknown> {
    return this.ensure().pipe(
      switchMap(() => this.http.post<unknown>(this.url(path), body, headers ? { headers } : {})),
    );
  }

  /** Falla con mensaje claro si no hay endpoint configurado (`R-UX-4`). */
  private ensure(): Observable<void> {
    return environment.aiScraperUrl.trim().length > 0
      ? of(undefined)
      : throwError(
          () =>
            new Error(
              'El backend de IA no está configurado (environment.aiScraperUrl). Pide al administrador la URL del servicio.',
            ),
        );
  }

  private url(path: string): string {
    return `${environment.aiScraperUrl.replace(/\/$/, '')}${path}`;
  }
}
