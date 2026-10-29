import { CashMoneyPipe } from './cash-money.pipe';

describe('CashMoneyPipe', () => {
  const pipe = new CashMoneyPipe();

  it('debe mostrar el código ISO y dos decimales', () => {
    expect(pipe.transform(1215657.98)).toBe('NIO 1,215,657.98');
    expect(pipe.transform(0)).toBe('NIO 0.00');
    expect(pipe.transform(-50)).toBe('-NIO 50.00');
  });

  it('debe devolver vacío para valores nulos o inválidos', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
  });
});
