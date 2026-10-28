import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptShipmentFromBackend,
  adaptShipmentsFromBackend,
} from '../../adapters/envio/envio.adapter';
import { Shipment, ShipmentProvider } from '../../models/envio.model';
import { EnvioRepository } from '../../repositories/envio.repository';

/** Guías de despacho de logística (`/admin/envios`, `/empresarios/me/envios`, `/envios`). */
@Injectable({
  providedIn: 'root',
})
export class EnvioService implements EnvioRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoints = environment.apiConfig.endpoints;

  listAdmin(): Observable<Shipment[]> {
    return this.list(`${environment.apiUrl}${this.endpoints.adminShipments}`);
  }

  listCompany(): Observable<Shipment[]> {
    return this.list(`${environment.apiUrl}${this.endpoints.companyShipments}`);
  }

  assignProvider(id: string, provider: ShipmentProvider): Observable<Shipment> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${this.endpoints.companyShipments}/${encodeURIComponent(id)}/asignacion`,
        { proveedor_tipo: provider },
      )
      .pipe(
        map((response) => this.requireShipment(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo asignar la flota.'))),
        ),
      );
  }

  advanceStatus(id: string, status: string, reason?: string): Observable<Shipment> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.endpoints.shipments}/${encodeURIComponent(id)}/estado`,
        { estado: status, motivo: reason },
      )
      .pipe(
        map((response) => this.requireShipment(response)),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo actualizar el estado del envío.')),
          ),
        ),
      );
  }

  private list(url: string): Observable<Shipment[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(url).pipe(
      map((response) => adaptShipmentsFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los envíos.'))),
      ),
    );
  }

  private requireShipment(response: unknown): Shipment {
    const shipment = adaptShipmentFromBackend(response);
    if (!shipment) throw new Error('No se pudo interpretar el envío.');
    return shipment;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
