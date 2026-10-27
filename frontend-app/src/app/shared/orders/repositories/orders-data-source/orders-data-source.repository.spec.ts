import { createOrdersDataSourceToken } from './orders-data-source.repository';

describe('createOrdersDataSourceToken', () => {
  it('debe crear un token independiente con la descripción recibida', () => {
    const first = createOrdersDataSourceToken('PrimeraFuente');
    const second = createOrdersDataSourceToken('SegundaFuente');

    expect(first).not.toBe(second);
    expect(first.toString()).toContain('PrimeraFuente');
  });
});
