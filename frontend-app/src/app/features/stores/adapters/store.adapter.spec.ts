import { adaptCatalogOptionsFromBackend, adaptStoreFromBackend } from './store.adapter';

describe('store.adapter', () => {
  describe('adaptStoreFromBackend', () => {
    it('debe mapear la tienda cuando llega en snake_case', () => {
      expect(
        adaptStoreFromBackend({
          id: 't-1',
          vendedor_id: 'v-1',
          nombre: 'Mi Tienda',
          descripcion: 'Demo',
        }),
      ).toEqual({ id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: 'Demo' });
    });

    it('debe mapear la tienda cuando llega en camelCase', () => {
      expect(
        adaptStoreFromBackend({
          id: 't-2',
          vendorId: 'v-2',
          nombre: 'Otra',
          descripcion: 'x',
        }),
      ).toEqual({ id: 't-2', vendorId: 'v-2', name: 'Otra', description: 'x' });
    });

    it('debe normalizar el id cuando llega numérico', () => {
      expect(adaptStoreFromBackend({ id: 123, nombre: 'Num' })?.id).toBe('123');
    });

    it('debe aplicar fallbacks cuando faltan nombre, descripción o vendedor', () => {
      expect(adaptStoreFromBackend({ id: 't-3' })).toEqual({
        id: 't-3',
        vendorId: '',
        name: 'Tienda',
        description: '',
      });
    });

    it('debe ignorar campos de más y tipos inesperados', () => {
      expect(
        adaptStoreFromBackend({ id: 't-4', nombre: 42, descripcion: null, extra: 'x' } as unknown),
      ).toEqual({ id: 't-4', vendorId: '', name: 'Tienda', description: '' });
    });

    it('debe devolver null cuando no hay id o la entrada no es válida', () => {
      expect(adaptStoreFromBackend(null)).toBeNull();
      expect(adaptStoreFromBackend(undefined)).toBeNull();
      expect(adaptStoreFromBackend({})).toBeNull();
      expect(adaptStoreFromBackend({ nombre: 'Sin id' })).toBeNull();
      expect(adaptStoreFromBackend({ id: '' })).toBeNull();
      expect(adaptStoreFromBackend([])).toBeNull();
      expect(adaptStoreFromBackend('texto')).toBeNull();
    });
  });

  describe('adaptCatalogOptionsFromBackend', () => {
    it('debe mapear el catálogo cuando llega como array plano', () => {
      const options = adaptCatalogOptionsFromBackend([
        { id: 'p-1', nombre: 'Teclado', sku: 'SKU-1' },
      ]);

      expect(options).toEqual([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }]);
    });

    it('debe mapear el catálogo cuando llega envuelto en { data }', () => {
      const options = adaptCatalogOptionsFromBackend({
        data: [{ id: 'p-2', nombre: 'Mouse', sku: 'SKU-2' }],
      });

      expect(options).toEqual([{ id: 'p-2', name: 'Mouse', sku: 'SKU-2' }]);
    });

    it('debe mapear el catálogo cuando llega envuelto en { items }', () => {
      const options = adaptCatalogOptionsFromBackend({
        items: [{ id: 'p-3', nombre: 'Pad', sku: 'SKU-3' }],
      });

      expect(options).toEqual([{ id: 'p-3', name: 'Pad', sku: 'SKU-3' }]);
    });

    it('debe mapear el catálogo cuando llega envuelto en { results }', () => {
      const options = adaptCatalogOptionsFromBackend({
        results: [{ id: 'p-4', nombre: 'Cable', sku: 'SKU-4' }],
      });

      expect(options).toEqual([{ id: 'p-4', name: 'Cable', sku: 'SKU-4' }]);
    });

    it('debe descartar entradas sin id y normalizar el id numérico', () => {
      const options = adaptCatalogOptionsFromBackend({
        items: [
          { id: 7, nombre: 'Siete', sku: 'SKU-7' },
          { nombre: 'Sin id' },
          { id: '', nombre: 'Vacío' },
        ],
      });

      expect(options).toEqual([{ id: '7', name: 'Siete', sku: 'SKU-7' }]);
    });

    it('debe aplicar fallbacks cuando faltan nombre o sku', () => {
      const options = adaptCatalogOptionsFromBackend([{ id: 'p-5' }]);

      expect(options).toEqual([{ id: 'p-5', name: 'Producto', sku: '' }]);
    });

    it('debe devolver un arreglo vacío cuando no hay datos válidos', () => {
      expect(adaptCatalogOptionsFromBackend(null)).toEqual([]);
      expect(adaptCatalogOptionsFromBackend(undefined)).toEqual([]);
      expect(adaptCatalogOptionsFromBackend({})).toEqual([]);
      expect(adaptCatalogOptionsFromBackend('texto')).toEqual([]);
      expect(adaptCatalogOptionsFromBackend([null, 'x', 3, { nombre: 'sin id' }])).toEqual([]);
    });
  });
});
