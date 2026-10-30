import {
  adaptCombosFromBackend,
  adaptImportResultFromBackend,
  adaptInventorySettingsFromBackend,
  adaptMovementsFromBackend,
  adaptPromotionsFromBackend,
  adaptScanResultFromBackend,
} from './company-catalog-operations.adapter';
import {
  COMBO_FIXTURE,
  IMPORT_RESULT_FIXTURE,
  INVENTORY_SETTINGS_FIXTURE,
  MOVEMENT_FIXTURE,
  PROMOTION_FIXTURE,
} from './fixtures/company-catalog-operations.fixture';
import { CATALOG_PRODUCT_FIXTURE } from '../../../products/adapters/fixtures/catalog-product.fixture';

// R-C-8: contrato contra fixtures versionados del backend, no contra el servicio en vivo.
describe('company-catalog-operations.contract', () => {
  it('normaliza ConfiguracionInventarioResponseDto', () => {
    expect(adaptInventorySettingsFromBackend(INVENTORY_SETTINGS_FIXTURE)).toEqual({
      companyId: 'empresa-demo',
      costMethod: 'fifo',
      allowNegativeStock: true,
      lowStockAlert: false,
      updateCostOnPurchase: true,
      defaultUnit: 'Caja',
      updatedAt: '2026-10-30T10:00:00.000Z',
    });
  });

  it('normaliza ComboResponseDto y sus componentes', () => {
    expect(adaptCombosFromBackend({ items: [COMBO_FIXTURE] })).toEqual([
      {
        id: 'combo-1',
        companyId: 'empresa-demo',
        sku: 'COMBO-1',
        name: 'Combo desayuno',
        description: 'Café y pan',
        barcode: '750001',
        price: 150,
        totalCost: 90,
        margin: 40,
        status: 'activo',
        components: [
          {
            productId: 'p-1',
            sku: 'SKU-1',
            name: 'Café',
            quantity: 2,
            unitCost: 45,
            subtotal: 90,
          },
        ],
        createdAt: '2026-10-30T10:00:00.000Z',
        updatedAt: '2026-10-30T10:00:00.000Z',
      },
    ]);
  });

  it('normaliza PromocionResponseDto', () => {
    expect(adaptPromotionsFromBackend({ items: [PROMOTION_FIXTURE] })).toEqual([
      {
        id: 'promo-1',
        companyId: 'empresa-demo',
        name: '2x1 café',
        type: 'descuento_cantidad',
        productId: 'p-1',
        sku: 'SKU-1',
        requiredQuantity: 2,
        freeQuantity: 1,
        discountPercentage: null,
        from: '2026-10-01',
        to: '2026-10-31',
        status: 'activo',
        createdAt: '2026-10-30T10:00:00.000Z',
        updatedAt: '2026-10-30T10:00:00.000Z',
      },
    ]);
  });

  it('normaliza MovimientoInventarioResponseDto y resultado de importación', () => {
    expect(adaptMovementsFromBackend({ items: [MOVEMENT_FIXTURE] })).toEqual([
      {
        id: 'mov-1',
        companyId: 'empresa-demo',
        type: 'traslado',
        reason: 'Reposición',
        reference: 'MOV-1',
        origin: 'Bodega',
        destination: 'Tienda',
        lines: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 3 }],
        createdBy: 'user-1',
        createdAt: '2026-10-30T10:00:00.000Z',
      },
    ]);
    expect(adaptImportResultFromBackend(IMPORT_RESULT_FIXTURE)).toEqual({
      imported: 2,
      skipped: 1,
      errors: ['Fila 3: SKU duplicado'],
    });
  });

  it('normaliza EscaneoResponseDto con producto versionado', () => {
    expect(
      adaptScanResultFromBackend({ tipo: 'producto', producto: CATALOG_PRODUCT_FIXTURE }),
    ).toMatchObject({ kind: 'producto', product: { id: CATALOG_PRODUCT_FIXTURE.id } });
  });
});
