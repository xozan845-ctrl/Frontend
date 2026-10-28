import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import { adaptPersonalListFromBackend } from '../../adapters/personal/personal.adapter';
import { FieldEmployee } from '../../models/personal.model';
import { PersonalRepository } from '../../repositories/personal.repository';

/** Personal de logística de campo (`GET /field/personal`). */
@Injectable({
  providedIn: 'root',
})
export class PersonalService implements PersonalRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiConfig.endpoints.field}/personal`;

  list(): Observable<FieldEmployee[]> {
    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`).pipe(
      map((response) => adaptPersonalListFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el personal.'))),
      ),
    );
  }
}
