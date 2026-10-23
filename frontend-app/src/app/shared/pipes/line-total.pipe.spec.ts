import { LineTotalPipe } from './line-total.pipe';

describe('LineTotalPipe', () => {
  const pipe = new LineTotalPipe();

  it('multiplica precio unitario por cantidad y redondea a dos decimales', () => {
    expect(pipe.transform({ unitPrice: 10.005, quantity: 3 })).toBe(30.02);
  });

  it('devuelve cero para una línea ausente', () => {
    expect(pipe.transform(null)).toBe(0);
  });
});
