import { AppDatePipe } from './app-date.pipe';

describe('AppDatePipe', () => {
  const pipe = new AppDatePipe();

  it('formatea una fecha sin hora sin saltos de zona horaria', () => {
    expect(pipe.transform('2026-10-12')).toContain('2026');
    expect(pipe.transform('2026-10-12')).toContain('12');
  });

  it('formatea fecha y hora cuando se pide datetime', () => {
    expect(pipe.transform('2026-10-12T15:30:00Z', 'datetime')).toMatch(/\d{2}:\d{2}/);
  });

  it('devuelve vacío para valores ausentes o inválidos', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('no-es-fecha')).toBe('');
  });
});
