import { describe, expect, it } from 'vitest';
import {
  parseMoney,
  validateCombo,
  validateMovement,
  validatePromotion,
} from './company-catalog-operations.validation';

describe('company catalog operations validators', () => {
  it('normaliza importes monetarios', () => {
    expect(parseMoney('10,50')).toBe(10.5);
    expect(parseMoney('-1')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });

  it('valida combos, promociones y movimientos', () => {
    expect(
      validateCombo({
        sku: 'COMBO-1',
        name: 'Combo',
        price: '10',
        components: [{ productId: 'p-1', name: 'Producto', sku: 'SKU-1', quantity: 1 }],
        description: '',
        barcode: '',
        status: 'activo',
      }),
    ).toBeNull();

    expect(
      validatePromotion({
        name: 'Promo',
        from: '2026-11-01',
        to: '2026-11-30',
        type: 'descuento_porcentaje',
        productId: '',
        sku: '',
        status: 'activo',
        discountPercentage: 10,
        requiredQuantity: null,
        freeQuantity: null,
      }),
    ).toBeNull();

    expect(
      validateMovement({
        type: 'entrada',
        origin: '',
        destination: '',
        lines: [{ productId: 'p-1', name: 'Producto', sku: 'SKU-1', quantity: 1 }],
        reason: '',
        reference: '',
      }),
    ).toBeNull();
  });
});
