import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AI_SCRAPER_KEY_STORAGE } from '../constants/ai-scraper.constants';

/**
 * Conexión con el backend de IA (`R-SE-1`): expone el endpoint configurado y la
 * API key **aportada en runtime** por el usuario. La key vive en `sessionStorage`
 * (se borra al cerrar la pestaña) y **nunca** forma parte del bundle (`R-SE-2`).
 *
 * Si el backend no exige autenticación, `hasKey()` es `false` y el interceptor no
 * añade ninguna cabecera; el flujo funciona igual.
 */
@Injectable({
  providedIn: 'root',
})
export class AiConnectionService {
  private readonly key = signal<string>(this.readStoredKey());

  /** API key actual (vacía si no hay). */
  readonly apiKey = this.key.asReadonly();

  /** ¿Hay una API key configurada? */
  readonly hasKey = computed(() => this.key().trim().length > 0);

  /** Endpoint configurado del backend de IA (`R-AR-11`). */
  get endpoint(): string {
    return environment.aiScraperUrl;
  }

  /** ¿El endpoint está configurado? */
  get isConfigured(): boolean {
    return environment.aiScraperUrl.trim().length > 0;
  }

  /** Guarda la API key en memoria y `sessionStorage`. */
  setApiKey(value: string): void {
    const trimmed = value.trim();
    this.key.set(trimmed);
    this.writeStoredKey(trimmed);
  }

  /** Olvida la API key (memoria y `sessionStorage`). */
  clearApiKey(): void {
    this.key.set('');
    this.writeStoredKey('');
  }

  private readStoredKey(): string {
    try {
      return typeof sessionStorage !== 'undefined'
        ? (sessionStorage.getItem(AI_SCRAPER_KEY_STORAGE) ?? '')
        : '';
    } catch {
      return '';
    }
  }

  private writeStoredKey(value: string): void {
    try {
      if (typeof sessionStorage === 'undefined') return;
      if (value) sessionStorage.setItem(AI_SCRAPER_KEY_STORAGE, value);
      else sessionStorage.removeItem(AI_SCRAPER_KEY_STORAGE);
    } catch {
      /* storage no disponible: la key sigue en memoria */
    }
  }
}
