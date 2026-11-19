import { Injectable } from '@angular/core';
import type { StorageEngine } from '../../repositories/storage-engine.repository';

/**
 * Adaptador en memoria para entornos sin `localStorage` y para las pruebas de
 * desacoplamiento del motor de almacenamiento.
 */
@Injectable()
export class MemoryStorageService implements StorageEngine {
  private readonly values = new Map<string, string>();

  get(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }

  remove(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}
