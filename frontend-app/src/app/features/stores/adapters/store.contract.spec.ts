import { adaptCatalogOptionsFromBackend, adaptStoreFromBackend } from './store.adapter';
import {
  CATALOGO_ENVELOPE_FIXTURE,
  TIENDA_DIRECT_FIXTURE,
  TIENDA_ENVELOPE_FIXTURE,
} from './fixtures/store.fixture';

// R-C-8: contrato contra un fixture realista versionado en el repo, no contra
// el backend en vivo. Si el shape cambia, el fixture cambia en el mismo PR.
describe('store.contract', () => {
  it('debe normalizar la tienda envuelta en { data } (snake_case)', () => {
    expect(adaptStoreFromBackend(TIENDA_ENVELOPE_FIXTURE)).toEqual({
      id: 't-9f1c',
      vendorId: 'v-42',
      name: 'Tienda Demo',
      description: 'Ropa y accesorios',
    });
  });

  it('debe normalizar la tienda cuando llega directa (sin envelope)', () => {
    expect(adaptStoreFromBackend(TIENDA_DIRECT_FIXTURE)).toEqual({
      id: 't-direct',
      vendorId: 'v-1',
      name: 'Tienda Directa',
      description: '',
    });
  });

  it('debe normalizar el catálogo envuelto en { data } y el id numérico', () => {
    expect(adaptCatalogOptionsFromBackend(CATALOGO_ENVELOPE_FIXTURE)).toEqual([
      { id: 'p-1', name: 'Teclado Mecánico', sku: 'SKU-TEC' },
      { id: '2', name: 'Mouse Gamer', sku: 'SKU-MOU' },
    ]);
  });
});
