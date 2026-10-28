/**
 * Constantes de la integración con `ai_scraper_executor` (`R-AR-13`). El host del
 * endpoint vive en `environment.aiScraperUrl`; aquí solo los paths relativos y
 * los parámetros de la integración.
 */
export const AI_SCRAPER_ENDPOINTS = {
  jobs: '/jobs',
  sessions: '/sessions',
} as const;

/** Cabecera de autenticación del backend (opcional según despliegue). */
export const AI_SCRAPER_API_KEY_HEADER = 'x-api-key';

/**
 * Clave de `sessionStorage` para la API key del backend, si su despliegue la
 * exige (`R-NC-11`). Se aporta en runtime; **nunca** va en el bundle (`R-SE-2`).
 */
export const AI_SCRAPER_KEY_STORAGE = 'ecom_ai_scraper_key';

/** Cadencia de sondeo de estados asíncronos (jobs y radiografías). */
export const AI_SCRAPER_POLL_MS = 3000;

/** Tope de sondeos antes de rendirse (evita bucles infinitos). */
export const AI_SCRAPER_POLL_MAX_ATTEMPTS = 200;

/** Sitios públicos de práctica para las sugerencias del chat de IA. */
export const AI_SCRAPER_PRACTICE_SITES = {
  catalog: 'https://books.toscrape.com/',
  articles: 'https://quotes.toscrape.com/',
  example: 'https://scrapethissite.com/',
} as const;
