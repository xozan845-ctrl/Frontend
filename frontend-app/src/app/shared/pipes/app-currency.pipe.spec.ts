import { AppCurrencyPipe } from './app-currency.pipe';

describe('AppCurrencyPipe', () => {
  const pipe = new AppCurrencyPipe();

  it('formatea montos en córdobas con separadores locales', () => {
    expect(pipe.transform(1200)).toBe('C$1,200.00');
    expect(pipe.transform(10925.5)).toBe('C$10,925.50');
    expect(pipe.transform(0)).toBe('C$0.00');
  });

  it('devuelve cadena vacía para nulos o no numéricos', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
  });
});
