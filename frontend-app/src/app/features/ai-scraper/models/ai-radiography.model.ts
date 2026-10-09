/** Modelo de dominio de radiografía / memoria de sitios (`R-CX-4`). */

/** Resultado directo de `POST /radiography`. */
export interface AiRadiographyResult {
  domain: string;
  profileId: string;
  discovered: number;
  radiography: unknown;
}

/** Selectores recomendados + recomendación de navegador (`/profile/:domain/selectors`). */
export interface AiLearnedProfile {
  shouldUseBrowser: boolean;
  recommendedSelectors: unknown;
  profile: unknown;
}

/** Entrada de aplicación para lanzar una radiografía. */
export interface AiRadiographyInput {
  url: string;
  maxDepth?: number;
  maxPages?: number;
  forceBrowser?: boolean;
}
