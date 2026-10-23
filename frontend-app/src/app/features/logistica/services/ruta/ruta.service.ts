import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import {
  adaptParadaFromBackend,
  adaptRutaFromBackend,
  adaptRutasFromBackend,
} from '../../adapters/ruta/ruta.adapter';
import { Parada, Ruta } from '../../models/ruta.model';
import { RutaRepository } from '../../repositories/ruta.repository';

/** Rutas y paradas de logística de campo (`/field/rutas`). */
@Injectable({
  providedIn: 'root',
})
export class RutaService implements RutaRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiConfig.endpoints.field}/rutas`;

  list(): Observable<Ruta[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`).pipe(
      map((response) => adaptRutasFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar las rutas.'))),
      ),
    );
  }

  updateStatus(routeId: string, status: string): Observable<Ruta> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${environment.apiUrl}${this.endpoint}/${encodeURIComponent(routeId)}`, {
        estado: status,
      })
      .pipe(
        map((response) => this.requireRoute(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar la ruta.'))),
        ),
      );
  }

  updateStop(
    routeId: string,
    stopId: string,
    updates: { name: string; completed: boolean },
  ): Observable<Parada> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(routeId)}/paradas/${encodeURIComponent(stopId)}`,
        { nombre: updates.name, completada: updates.completed },
      )
      .pipe(
        map((response) => {
          const stop = adaptParadaFromBackend(response, routeId);
          if (!stop) throw new Error('No se pudo interpretar la parada.');
          return stop;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar la parada.'))),
        ),
      );
  }

  private requireRoute(response: unknown): Ruta {
    const route = adaptRutaFromBackend(response);
    if (!route) throw new Error('No se pudo interpretar la ruta.');
    return route;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
