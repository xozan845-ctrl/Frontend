import { adaptCompanyOrdersFromBackend } from './company-order.adapter';
import { COMPANY_ORDER_VIEW_FIXTURE } from '../fixtures/company-order.fixture';

// R-C-8: contrato contra el DTO de órdenes versionado del gateway.
describe('company-order.contract', () => {
  it('normaliza OrderViewResponseDto a la vista de órdenes de empresa', () => {
    const [order] = adaptCompanyOrdersFromBackend({ data: [COMPANY_ORDER_VIEW_FIXTURE] });

    expect(order).toMatchObject({
      id: COMPANY_ORDER_VIEW_FIXTURE.id,
      status: 'pagada',
      total: 2300,
      commission: 276,
      buyerId: 'comprador-1',
      storeId: 'tienda-1',
      createdAt: COMPANY_ORDER_VIEW_FIXTURE.creado_en,
      items: [
        {
          ofertaId: 'oferta-1',
          sku: 'SKU-001',
          name: 'Teclado Mecánico',
          quantity: 2,
          unitPrice: 1150,
          storeId: 'tienda-1',
        },
      ],
    });
  });
});
