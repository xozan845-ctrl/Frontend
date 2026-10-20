import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiConnectionStore } from './ai-connection.store';
import { AI_SCRAPER_KEY_STORAGE } from '../constants/ai-scraper.constants';

describe('AiConnectionStore', () => {
  let store: AiConnectionStore;

  beforeEach(() => {
    sessionStorage.removeItem(AI_SCRAPER_KEY_STORAGE);
    TestBed.configureTestingModule({ providers: [AiConnectionStore] });
    store = TestBed.inject(AiConnectionStore);
  });

  afterEach(() => {
    sessionStorage.removeItem(AI_SCRAPER_KEY_STORAGE);
    TestBed.resetTestingModule();
  });

  it('debe empezar sin clave cuando no hay nada persistido', () => {
    expect(store.hasKey()).toBe(false);
    expect(store.apiKey()).toBe('');
  });

  it('debe guardar la clave en memoria y sessionStorage, recortando espacios', () => {
    store.setApiKey('  secret  ');
    expect(store.apiKey()).toBe('secret');
    expect(store.hasKey()).toBe(true);
    expect(sessionStorage.getItem(AI_SCRAPER_KEY_STORAGE)).toBe('secret');
  });

  it('debe leer una clave ya persistida al construirse', () => {
    sessionStorage.setItem(AI_SCRAPER_KEY_STORAGE, 'persistida');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [AiConnectionStore] });
    expect(TestBed.inject(AiConnectionStore).apiKey()).toBe('persistida');
  });

  it('debe limpiar la clave de memoria y sessionStorage', () => {
    store.setApiKey('secret');
    store.clearApiKey();
    expect(store.hasKey()).toBe(false);
    expect(sessionStorage.getItem(AI_SCRAPER_KEY_STORAGE)).toBeNull();
  });

  it('debe exponer el endpoint configurado del backend de IA', () => {
    expect(store.endpoint).toBe('http://localhost:3000/api/v1');
    expect(store.isConfigured).toBe(true);
  });
});
