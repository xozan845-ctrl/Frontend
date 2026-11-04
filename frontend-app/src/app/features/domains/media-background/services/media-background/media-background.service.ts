import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { MediaBackgroundConfig } from '../../../../../core/models/media-background.model';
import { MediaBackgroundRepository } from '../../repositories/media-background.repository';
import { adaptMediaBackgroundFromBackend } from '../../adapters/media-background/media-background.adapter';

/**
 * Lectura del fondo multimedia de plataforma, empresa y tienda. Es un read
 * model transversal: no modifica entidades ni conoce reglas de negocio.
 *
 * La página nunca llama a este servicio directamente; consume
 * `MediaBackgroundStore` (R-AR-3, R-ST).
 */
@Injectable({ providedIn: 'root' })
export class MediaBackgroundService implements MediaBackgroundRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = environment.apiConfig.endpoints;

  /** `GET /configuracion/sitio` (público). */
  platform(): Observable<MediaBackgroundConfig> {
    return this.get(this.endpoints.siteConfig);
  }

  /** `GET /empresas/:id` (la respuesta incluye `background_*`). */
  company(companyId: string): Observable<MediaBackgroundConfig> {
    return this.get(`${this.endpoints.companies}/${encodeURIComponent(companyId)}`);
  }

  /** `GET /tiendas/:id` (público; respuesta `{ tienda, ofertas }`). */
  store(storeId: string): Observable<MediaBackgroundConfig> {
    return this.get(`${this.endpoints.storefront}/${encodeURIComponent(storeId)}`);
  }

  private get(path: string): Observable<MediaBackgroundConfig> {
    if (!this.apiUrl) {
      return throwError(
        () => new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend.'),
      );
    }
    return this.http
      .get<unknown>(`${this.apiUrl}${path}`)
      .pipe(map((response) => adaptMediaBackgroundFromBackend(response)));
  }
}
