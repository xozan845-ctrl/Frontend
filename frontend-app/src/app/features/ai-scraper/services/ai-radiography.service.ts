import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AiLearnedProfile,
  AiRadiographyInput,
  AiRadiographyResult,
} from '../models/ai-radiography.model';
import { AiRadiographyRepository } from '../repositories/ai-radiography.repository';
import { AI_SCRAPER_ENDPOINTS } from '../constants/ai-scraper.constants';
import {
  adaptLearnedProfileFromBackend,
  adaptRadiographyFromBackend,
} from '../adapters/ai-scraper.adapter';
import { AiScraperClient } from './ai-scraper-client.service';
import { fail } from './ai-scraper-error';

/** Convierte la entrada de dominio al cuerpo que espera `POST /radiography`. */
function toBackendRadiographyPayload(input: AiRadiographyInput): Record<string, unknown> {
  const body: Record<string, unknown> = { url: input.url };
  if (input.maxDepth !== undefined) body['maxDepth'] = input.maxDepth;
  if (input.maxPages !== undefined) body['maxPages'] = input.maxPages;
  if (input.forceBrowser !== undefined) body['forceBrowser'] = input.forceBrowser;
  return body;
}

/** Implementación HTTP del puerto de radiografía (`R-CX-2`). */
@Injectable({
  providedIn: 'root',
})
export class AiRadiographyService implements AiRadiographyRepository {
  private readonly client = inject(AiScraperClient);

  run(input: AiRadiographyInput): Observable<AiRadiographyResult> {
    return this.client
      .post(AI_SCRAPER_ENDPOINTS.radiography, toBackendRadiographyPayload(input))
      .pipe(map(adaptRadiographyFromBackend), fail('No se pudo completar la radiografía.'));
  }

  getLearnedProfile(domain: string): Observable<AiLearnedProfile> {
    return this.client
      .get(`${AI_SCRAPER_ENDPOINTS.radiography}/profile/${encodeURIComponent(domain)}/selectors`)
      .pipe(map(adaptLearnedProfileFromBackend), fail('No se pudo cargar el perfil del dominio.'));
  }
}
