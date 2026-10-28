import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptIncidenciaFromBackend,
  adaptIncidenciasFromBackend,
} from '../../adapters/incidencia/incidencia.adapter';
import { FieldIncident } from '../../models/incidencia.model';
import { IncidenciaChanges, IncidenciaRepository } from '../../repositories/incidencia.repository';

/** Incidencias de logística de campo (`/field/incidencias`). */
@Injectable({
  providedIn: 'root',
})
export class IncidenciaService implements IncidenciaRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiConfig.endpoints.field}/incidencias`;

  list(): Observable<FieldIncident[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`).pipe(
      map((response) => adaptIncidenciasFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar las incidencias.'))),
      ),
    );
  }

  update(id: string, changes: IncidenciaChanges): Observable<FieldIncident> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}`, {
        ...(changes.status !== undefined ? { estado: changes.status } : {}),
        ...(changes.resolution !== undefined ? { resolucion: changes.resolution } : {}),
      })
      .pipe(
        map((response) => {
          const incident = adaptIncidenciaFromBackend(response);
          if (!incident) throw new Error('No se pudo interpretar la incidencia.');
          return incident;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar la incidencia.'))),
        ),
      );
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
