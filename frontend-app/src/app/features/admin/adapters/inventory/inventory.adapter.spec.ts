import { adaptInventoryFromBackend, adaptInventoryLineFromBackend } from './inventory.adapter';
import { INVENTORY_FIXTURE } from '../fixtures/inventory.fixture';

describe('inventory.adapter', () => {
  it('debe normalizar una línea completa con tipos string', () => {
    const line = adaptInventoryLineFromBackend(INVENTORY_FIXTURE[1]);

    expect(line).toEqual({
      sku: 'SKU-002',
      name: 'Mouse Gamer',
      stock: 0,
      available: 0,
      reserved: 0,
      status: 'agotado',
      basePrice: 50,
      availableValueCents: 0,
      totalValueCents: 0,
    });
  });

  it('debe normalizar la lista real de inventario', () => {
    const lines = adaptInventoryFromBackend(INVENTORY_FIXTURE);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      sku: 'SKU-001',
      stock: 12,
      available: 10,
      reserved: 2,
      basePrice: 1000,
      totalValueCents: 1200000,
    });
  });

  it('debe descartar líneas sin SKU y tolerar envelopes', () => {
    expect(adaptInventoryLineFromBackend({ nombre: 'Sin sku' })).toBeNull();
    expect(adaptInventoryLineFromBackend(null)).toBeNull();
    expect(adaptInventoryFromBackend({ data: INVENTORY_FIXTURE })).toHaveLength(2);
    expect(adaptInventoryFromBackend({ items: INVENTORY_FIXTURE })).toHaveLength(2);
    expect(adaptInventoryFromBackend(null)).toEqual([]);
  });

  it('debe usar fallbacks ante campos faltantes', () => {
    expect(adaptInventoryLineFromBackend({ sku: 'SKU-9' })).toEqual({
      sku: 'SKU-9',
      name: 'Producto',
      stock: 0,
      available: 0,
      reserved: 0,
      status: 'disponible',
      basePrice: 0,
      availableValueCents: 0,
      totalValueCents: 0,
    });
  });
});
