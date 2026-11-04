import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { MediaBackgroundConfig } from '../../../../core/models/media-background.model';

/**
 * Puerto de lectura del fondo multimedia. La infraestructura HTTP vive en
 * `MediaBackgroundService`; el store depende de esta abstracción (R-AR-3).
 */
export interface MediaBackgroundRepository {
  /** Fondo público de plataforma (`GET /configuracion/sitio`). */
  platform(): Observable<MediaBackgroundConfig>;
  /** Fondo de una empresa (`GET /empresas/:id`). */
  company(companyId: string): Observable<MediaBackgroundConfig>;
  /** Fondo público de una tienda (`GET /tiendas/:id`). */
  store(storeId: string): Observable<MediaBackgroundConfig>;
}

export const MEDIA_BACKGROUND_REPOSITORY = new InjectionToken<MediaBackgroundRepository>(
  'MediaBackgroundRepository',
);
