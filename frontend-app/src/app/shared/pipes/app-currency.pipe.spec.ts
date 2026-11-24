import { TestBed } from '@angular/core/testing';
import { StoreConfigService } from '../../core/services/store-config/store-config.service';
import { AppCurrencyPipe } from './app-currency.pipe';

describe('AppCurrencyPipe', () => {
  let pipe: AppCurrencyPipe;
  let storeConfig: StoreConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppCurrencyPipe] });
    storeConfig = TestBed.inject(StoreConfigService);
    storeConfig.clear();
    pipe = TestBed.inject(AppCurrencyPipe);
  });

  it('formatea montos con la moneda neutral del contexto', () => {
    expect(pipe.transform(1200)).toBe('C$1,200.00');
    expect(pipe.transform(10925.5)).toBe('C$10,925.50');
    expect(pipe.transform(0)).toBe('C$0.00');
  });

  it('usa la moneda del contexto sin depender del monto', () => {
    storeConfig.setContext('tienda-usd', { currency: { code: 'USD', locale: 'en-US' } });

    expect(pipe.transform(1200)).toBe('$1,200.00');

    storeConfig.setContext('tienda-eur', { currency: { code: 'EUR', locale: 'es-ES' } });

    expect(pipe.transform(1200)).toContain('€');
  });

  it('devuelve cadena vacía para nulos o no numéricos', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
  });
});
