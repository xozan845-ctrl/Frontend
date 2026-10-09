import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiConnectionService } from './ai-connection.service';
import { AI_SCRAPER_KEY_STORAGE } from '../constants/ai-scraper.constants';

describe('AiConnectionService', () => {
  let service: AiConnectionService;

  beforeEach(() => {
    sessionStorage.removeItem(AI_SCRAPER_KEY_STORAGE);
    TestBed.configureTestingModule({ providers: [AiConnectionService] });
    service = TestBed.inject(AiConnectionService);
  });

  afterEach(() => {
    sessionStorage.removeItem(AI_SCRAPER_KEY_STORAGE);
    TestBed.resetTestingModule();
  });

  it('debe empezar sin clave cuando no hay nada persistido', () => {
    expect(service.hasKey()).toBe(false);
    expect(service.apiKey()).toBe('');
  });

  it('debe guardar la clave en memoria y sessionStorage, recortando espacios', () => {
    service.setApiKey('  secret  ');
    expect(service.apiKey()).toBe('secret');
    expect(service.hasKey()).toBe(true);
    expect(sessionStorage.getItem(AI_SCRAPER_KEY_STORAGE)).toBe('secret');
  });

  it('debe leer una clave ya persistida al construirse', () => {
    sessionStorage.setItem(AI_SCRAPER_KEY_STORAGE, 'persistida');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [AiConnectionService] });
    expect(TestBed.inject(AiConnectionService).apiKey()).toBe('persistida');
  });

  it('debe limpiar la clave de memoria y sessionStorage', () => {
    service.setApiKey('secret');
    service.clearApiKey();
    expect(service.hasKey()).toBe(false);
    expect(sessionStorage.getItem(AI_SCRAPER_KEY_STORAGE)).toBeNull();
  });

  it('debe exponer el endpoint configurado del backend de IA', () => {
    expect(service.endpoint).toBe('http://localhost:3000/api/v1');
    expect(service.isConfigured).toBe(true);
  });
});
