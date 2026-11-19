import { Injectable } from '@angular/core';
import type { StorageEngine } from '../../repositories/storage-engine.repository';

/**
 * Adaptador de navegador para `localStorage`.
 *
 * No captura errores: `LocalStateService` los traduce a un resultado de
 * recuperación (`storage-unavailable`) para que el store nunca reciba una
 * excepción durante el arranque.
 */
@Injectable()
export class BrowserStorageService implements StorageEngine {
  get(key: string): string | null {
    return globalThis.localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    globalThis.localStorage.setItem(key, value);
  }

  remove(key: string): void {
    globalThis.localStorage.removeItem(key);
  }
}
