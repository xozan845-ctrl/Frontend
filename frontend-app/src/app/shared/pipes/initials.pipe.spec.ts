import { InitialsPipe } from './initials.pipe';

describe('InitialsPipe', () => {
  const pipe = new InitialsPipe();

  it('devuelve las dos primeras iniciales en mayúscula', () => {
    expect(pipe.transform('  ana   pérez gómez ')).toBe('AP');
  });

  it('devuelve vacío para valores nulos o vacíos', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('   ')).toBe('');
  });
});
