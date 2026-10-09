import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AiConnectionService } from '../services/ai-connection.service';
import { AI_SCRAPER_API_KEY_HEADER } from '../constants/ai-scraper.constants';

/**
 * Añade la cabecera `x-api-key` **solo** a las peticiones dirigidas al backend de
 * IA (`R-SE-1`, `R-SE-8`): el token no viaja a ningún otro host. Si no hay key
 * configurada (backend abierto), no toca la petición.
 */
export const aiScraperAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.aiScraperUrl;
  if (!base || !req.url.startsWith(base)) {
    return next(req);
  }

  const apiKey = inject(AiConnectionService).apiKey().trim();
  if (!apiKey) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { [AI_SCRAPER_API_KEY_HEADER]: apiKey } }));
};
