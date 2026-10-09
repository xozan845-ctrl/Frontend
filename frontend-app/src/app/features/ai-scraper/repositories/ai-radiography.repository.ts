import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AiLearnedProfile,
  AiRadiographyInput,
  AiRadiographyResult,
} from '../models/ai-radiography.model';

/**
 * Puerto de radiografía / memoria de sitios (`R-AR-3`, `R-SO-4`): analiza una URL
 * y expone el perfil aprendido (selectores + recomendación de navegador).
 */
export interface AiRadiographyRepository {
  /** Lanza una radiografía real de una URL. */
  run(input: AiRadiographyInput): Observable<AiRadiographyResult>;
  /** Perfil aprendido de un dominio (selectores listos para usar). */
  getLearnedProfile(domain: string): Observable<AiLearnedProfile>;
}

export const AI_RADIOGRAPHY_REPOSITORY = new InjectionToken<AiRadiographyRepository>(
  'AiRadiographyRepository',
);
