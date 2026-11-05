import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  MediaBackgroundConfig,
  MediaBackgroundDraft,
} from '../../../../../core/models/media-background.model';
import {
  adaptMediaBackgroundFromBackend,
  adaptPanelAiMediaBackgroundFromBackend,
} from '../../adapters/media-background/media-background.adapter';

export type MediaBackgroundSiteScope = 'platform' | 'panel-ai';

/**
 * Escritura de fondos multimedia. Mantiene el mismo contrato para los cuatro
 * ámbitos y deriva el prefijo del payload según el scope.
 *
 * - platform / panel-ai → `PATCH /configuracion/sitio` (admin/super_admin).
 * - company → `PATCH /empresas/:id/perfil` (empresario/admin).
 * - store → `PATCH /tiendas/:id/background` (vendedor/empresario/admin).
 */
@Injectable({ providedIn: 'root' })
export class MediaBackgroundWriteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = environment.apiConfig.endpoints;

  updateSite(
    scope: MediaBackgroundSiteScope,
    draft: MediaBackgroundDraft,
  ): Observable<MediaBackgroundConfig> {
    const prefijo = scope === 'panel-ai' ? 'panel_ai_background' : 'background';
    return this.patch(
      this.endpoints.siteConfig,
      this.payload(draft, prefijo),
      scope === 'panel-ai'
        ? adaptPanelAiMediaBackgroundFromBackend
        : adaptMediaBackgroundFromBackend,
    );
  }

  updateCompany(
    companyId: string,
    draft: MediaBackgroundDraft,
  ): Observable<MediaBackgroundConfig> {
    return this.patch(
      `${this.endpoints.companies}/${encodeURIComponent(companyId)}/perfil`,
      this.payload(draft),
      adaptMediaBackgroundFromBackend,
    );
  }

  updateStore(storeId: string, draft: MediaBackgroundDraft): Observable<MediaBackgroundConfig> {
    return this.patch(
      `${this.endpoints.storefront}/${encodeURIComponent(storeId)}/background`,
      this.payload(draft),
      adaptMediaBackgroundFromBackend,
    );
  }

  private payload(
    draft: MediaBackgroundDraft,
    prefijo = 'background',
  ): Record<string, unknown> {
    return {
      [`${prefijo}_objeto_id`]: draft.objectId,
      [`${prefijo}_poster_objeto_id`]: draft.posterObjectId,
      [`${prefijo}_alt`]: draft.alt,
      [`${prefijo}_overlay`]: draft.overlay,
      [`${prefijo}_position`]: draft.position,
      [`${prefijo}_activo`]: draft.active,
    };
  }

  private patch(
    path: string,
    body: Record<string, unknown>,
    adapter: (raw: unknown) => MediaBackgroundConfig,
  ): Observable<MediaBackgroundConfig> {
    if (!this.apiUrl) {
      return throwError(
        () => new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend.'),
      );
    }
    return this.http.patch<unknown>(`${this.apiUrl}${path}`, body).pipe(
      map((response) => adapter(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo guardar el fondo.'))),
      ),
    );
  }
}
