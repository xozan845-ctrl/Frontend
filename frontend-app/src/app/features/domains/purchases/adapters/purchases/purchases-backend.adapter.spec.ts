import { describe, expect, it } from 'vitest';
import { migrateFinancePurchases, sanitizePurchaseRecords } from './purchases-backend.adapter';

describe('purchases backend adapter', () => {
  it('normaliza compras persistidas y descarta registros inválidos', () => {
    const result = sanitizePurchaseRecords([
      {
        id: 'p-1',
        number: 'C-0001',
        date: '2026-11-01',
        lines: [{ name: 'Taladro', quantity: 2, unitCost: 100 }],
        status: 'recibida',
        paymentMethod: 'efectivo',
        origin: 'productos',
        costType: 'inventario',
      },
      { id: '', number: '', date: '', lines: [] },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'p-1', subtotal: 200, total: 200 });
  });

  it('migra compras simples del módulo de finanzas', () => {
    const result = migrateFinancePurchases([
      {
        id: 'old-1',
        date: '2026-10-01',
        supplier: 'Distribuidora',
        concept: 'Compra',
        amount: 150,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ supplierName: 'Distribuidora', total: 150 });
  });
});
