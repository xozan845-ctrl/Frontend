import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { environment } from '../../../../../../environments/environment';
import { AI_SCRAPER_KEY_STORAGE } from '../../constants/ai-scraper.constants';

function readStoredKey(): string {
  try {
    return typeof sessionStorage !== 'undefined'
      ? (sessionStorage.getItem(AI_SCRAPER_KEY_STORAGE) ?? '')
      : '';
  } catch {
    return '';
  }
}

function writeStoredKey(value: string): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (value) sessionStorage.setItem(AI_SCRAPER_KEY_STORAGE, value);
    else sessionStorage.removeItem(AI_SCRAPER_KEY_STORAGE);
  } catch {
    /* storage no disponible: la key sigue en memoria */
  }
}

/**
 * Conexión con el backend de IA (`R-SE-1`, `R-ST-2`): expone el endpoint
 * configurado y la API key **aportada en runtime** por el usuario. La key vive
 * en `sessionStorage` (se borra al cerrar la pestaña) y **nunca** forma parte
 * del bundle (`R-SE-2`).
 *
 * Si el backend no exige autenticación, `hasKey()` es `false` y el interceptor
 * no añade ninguna cabecera; el flujo funciona igual.
 */
export const AiConnectionStore = signalStore(
  { providedIn: 'root' },
  withState({ key: '' }),
  withHooks({
    onInit(store) {
      patchState(store, { key: readStoredKey() });
    },
  }),
  withComputed(({ key }) => ({
    /** API key actual (vacía si no hay). */
    apiKey: computed(() => key()),
    /** ¿Hay una API key configurada? */
    hasKey: computed(() => key().trim().length > 0),
    /** Endpoint configurado del backend de IA (`R-AR-11`). */
    endpoint: computed(() => environment.aiScraperUrl),
    /** ¿El endpoint está configurado? */
    isConfigured: computed(() => environment.aiScraperUrl.trim().length > 0),
  })),
  withMethods((store) => ({
    /** Guarda la API key en memoria y `sessionStorage`. */
    setApiKey(value: string): void {
      const trimmed = value.trim();
      patchState(store, { key: trimmed });
      writeStoredKey(trimmed);
    },
    /** Olvida la API key (memoria y `sessionStorage`). */
    clearApiKey(): void {
      patchState(store, { key: '' });
      writeStoredKey('');
    },
  })),
);
