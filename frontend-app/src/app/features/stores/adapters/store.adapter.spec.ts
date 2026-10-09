import { adaptCatalogOptionsFromBackend, adaptStoreFromBackend } from './store.adapter';

describe('store.adapter', () => {
  describe('adaptStoreFromBackend', () => {
    it('debe mapear la tienda del vendedor (snake_case)', () => {
      expect(
        adaptStoreFromBackend({
          id: 't-1',
          vendedor_id: 'v-1',
          nombre: 'Mi Tienda',
          descripcion: 'Demo',
        }),
      ).toEqual({ id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: 'Demo' });
    });

    it('debe devolver null si no hay id o el valor no es válido', () => {
      expect(adaptStoreFromBackend(null)).toBeNull();
      expect(adaptStoreFromBackend({ nombre: 'Sin id' })).toBeNull();
    });
  });

  describe('adaptCatalogOptionsFromBackend', () => {
    it('debe mapear el catálogo y descartar entradas sin id', () => {
      const options = adaptCatalogOptionsFromBackend({
        items: [{ id: 'p-1', nombre: 'Teclado', sku: 'SKU-1' }, { nombre: 'Sin id' }],
      });

      expect(options).toEqual([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }]);
    });

    it('debe devolver un arreglo vacío cuando no hay datos', () => {
      expect(adaptCatalogOptionsFromBackend(null)).toEqual([]);
    });
  });
});
