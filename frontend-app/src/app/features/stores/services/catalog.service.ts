import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { CatalogProductOption } from '../models/store-wizard.model';
import { CatalogRepository } from '../repositories/catalog.repository';
import { adaptCatalogOptionsFromBackend } from '../adapters/store.adapter';

const MOCK_CATALOG: CatalogProductOption[] = [
  { id: 'p-demo-1', name: 'Teclado Mecánico', sku: 'SKU-TEC' },
  { id: 'p-demo-2', name: 'Mouse Gamer', sku: 'SKU-MOU' },
];

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements CatalogRepository {
  private readonly http = inject(HttpClient);
  private readonly catalogEndpoint =
    environment.apiConfig?.endpoints?.products || '/catalog/productos';

  listCatalog(): Observable<CatalogProductOption[]> {
    if (this.isMock()) return of(MOCK_CATALOG).pipe(delay(300));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.catalogEndpoint}`).pipe(
      map((response) => adaptCatalogOptionsFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el catálogo.'))),
      ),
    );
  }

  private isMock(): boolean {
    return environment.apiConfig?.dataSource === 'mock';
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
