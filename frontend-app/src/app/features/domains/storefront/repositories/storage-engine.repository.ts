import { InjectionToken } from '@angular/core';

/**
 * Motor de almacenamiento de bajo nivel.
 *
 * `LocalStateService` depende de esta abstracción para que la validación y la
 * recuperación no dependan de `localStorage`, de un mock o de otro contexto.
 */
export interface StorageEngine {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const STORAGE_ENGINE = new InjectionToken<StorageEngine>('StorageEngine');
