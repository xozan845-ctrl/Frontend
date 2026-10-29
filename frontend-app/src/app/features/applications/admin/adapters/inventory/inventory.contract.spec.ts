import { adaptInventoryFromBackend } from './inventory.adapter';
import { INVENTORY_FIXTURE } from '../fixtures/inventory.fixture';

// R-C-8: contrato contra `LineaInventarioResponseDto` versionado.
describe('inventory.contract', () => {
  it('normaliza la respuesta de inventario del gateway', () => {
    const [line] = adaptInventoryFromBackend({ data: INVENTORY_FIXTURE });

    expect(line).toMatchObject({
      sku: 'SKU-001',
      name: 'Teclado Mecánico',
      stock: 12,
      available: 10,
      reserved: 2,
      basePrice: 1000,
      totalValueCents: 1200000,
    });
  });
});
