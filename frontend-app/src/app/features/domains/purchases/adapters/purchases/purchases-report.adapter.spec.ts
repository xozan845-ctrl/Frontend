import { describe, expect, it } from 'vitest';
import { purchasePageCount } from '../../constants/purchases.constants';

describe('purchases report adapter', () => {
  it('calcula el número de páginas del historial', () => {
    expect(purchasePageCount(0)).toBe(1);
    expect(purchasePageCount(8)).toBe(1);
    expect(purchasePageCount(9)).toBe(2);
    expect(purchasePageCount(16)).toBe(2);
  });
});
