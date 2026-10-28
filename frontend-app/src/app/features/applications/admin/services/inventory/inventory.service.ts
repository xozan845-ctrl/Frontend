import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import { adaptInventoryFromBackend } from '../../adapters/inventory/inventory.adapter';
import { InventoryLine } from '../../models/inventory.model';
import { InventoryRepository } from '../../repositories/inventory.repository';

/** Inventario de bodega (`GET /admin/inventario`). */
@Injectable({
  providedIn: 'root',
})
export class InventoryService implements InventoryRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig.endpoints.inventory;

  list(): Observable<InventoryLine[]> {
    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`).pipe(
      map((response) => adaptInventoryFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el inventario.'))),
      ),
    );
  }
}
