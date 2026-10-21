import { describe, expect, it } from 'vitest';
import { lastValueFrom, throwError } from 'rxjs';
import { fail, requireValue } from './ai-scraper-error';

describe('ai-scraper-error', () => {
  it('debe devolver el valor cuando existe', () => {
    expect(requireValue('valor', 'mensaje')).toBe('valor');
  });

  it('debe lanzar el mensaje cuando el valor es null', () => {
    expect(() => requireValue(null, 'mensaje de dominio')).toThrow('mensaje de dominio');
  });

  it('debe traducir un error de la fuente a un mensaje de dominio', async () => {
    await expect(
      lastValueFrom(throwError(() => new Error('boom')).pipe(fail('fallback'))),
    ).rejects.toThrow('boom');
  });
});
