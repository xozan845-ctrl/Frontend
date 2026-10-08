import {
  adaptProductFromBackend,
  adaptProductListFromBackend,
  adaptSingleProductFromBackend,
  adaptStoreFromBackend,
  adaptStorefrontFromBackend,
  buildCatalogLookup,
} from './product.adapter';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30';

describe('product.adapter', () => {
  describe('adaptProductFromBackend', () => {
    it('debe devolver un producto por defecto cuando recibe un valor no válido', () => {
      const product = adaptProductFromBackend(null);

      expect(product.name).toBe('Producto sin nombre');
      expect(product.price).toBe(0);
      expect(product.category).toBe('General');
      expect(product.stock).toBe(0);
      expect(product.imageUrl).toContain(FALLBACK_IMAGE);
    });

    it('debe mapear un producto en camelCase', () => {
      const product = adaptProductFromBackend({
        id: 7,
        name: 'Teclado',
        description: 'Mecánico',
        price: 99.5,
        originalPrice: 120,
        imageUrl: 'https://img/teclado.png',
        category: 'Periféricos',
        stock: 3,
      });

      expect(product).toMatchObject({
        id: 7,
        name: 'Teclado',
        description: 'Mecánico',
        price: 99.5,
        originalPrice: 120,
        imageUrl: 'https://img/teclado.png',
        category: 'Periféricos',
        stock: 3,
      });
    });

    it('debe mapear un producto en snake_case con nombres alternativos', () => {
      const product = adaptProductFromBackend({
        product_id: 'abc',
        product_name: 'Mouse',
        details: 'Inalámbrico',
        unit_price: '49.99',
        image_url: 'https://img/mouse.png',
        category_name: 'Periféricos',
        stock_quantity: '8',
      });

      expect(product.id).toBe('abc');
      expect(product.name).toBe('Mouse');
      expect(product.description).toBe('Inalámbrico');
      expect(product.price).toBeCloseTo(49.99, 2);
      expect(product.category).toBe('Periféricos');
      expect(product.stock).toBe(8);
    });

    it('debe ignorar el precio original cuando no es mayor al precio actual', () => {
      const product = adaptProductFromBackend({ price: 100, originalPrice: 80 });

      expect(product.originalPrice).toBeUndefined();
    });

    it('debe extraer la categoría cuando viene como objeto', () => {
      const product = adaptProductFromBackend({ category: { name: 'Audio' } });

      expect(product.category).toBe('Audio');
    });

    it('debe derivar el stock desde inventory, quantity o in_stock', () => {
      expect(adaptProductFromBackend({ inventory: 4 }).stock).toBe(4);
      expect(adaptProductFromBackend({ quantity: 6 }).stock).toBe(6);
      expect(adaptProductFromBackend({ in_stock: true }).stock).toBe(10);
      expect(adaptProductFromBackend({ in_stock: false }).stock).toBe(0);
    });

    it('debe usar stock 10 por defecto y la imagen principal en la galería', () => {
      const product = adaptProductFromBackend({ name: 'Genérico' });

      expect(product.stock).toBe(10);
      expect(product.images).toEqual([product.imageUrl]);
    });
  });

  describe('adaptProductListFromBackend', () => {
    it('debe normalizar una lista plana o envuelta en data/items/results', () => {
      expect(adaptProductListFromBackend([{ id: 1 }])).toHaveLength(1);
      expect(adaptProductListFromBackend({ data: [{ id: 1 }, { id: 2 }] })).toHaveLength(2);
      expect(adaptProductListFromBackend({ items: [{ id: 1 }] })).toHaveLength(1);
      expect(adaptProductListFromBackend({ results: [{ id: 1 }] })).toHaveLength(1);
    });

    it('debe devolver un arreglo vacío cuando no hay datos', () => {
      expect(adaptProductListFromBackend(null)).toEqual([]);
    });
  });

  describe('adaptSingleProductFromBackend', () => {
    it('debe desenvolver un producto envuelto en data', () => {
      const product = adaptSingleProductFromBackend({ data: { id: 5, name: 'Monitor' } });

      expect(product.id).toBe(5);
      expect(product.name).toBe('Monitor');
    });

    it('debe aceptar un producto directo', () => {
      const product = adaptSingleProductFromBackend({ id: 6, name: 'Webcam' });

      expect(product.name).toBe('Webcam');
    });
  });

  describe('adaptStoreFromBackend', () => {
    it('debe mapear la tienda del backend (snake_case)', () => {
      const store = adaptStoreFromBackend({
        id: 't-1',
        vendedor_id: 'v-1',
        nombre: 'Mi Tienda',
        descripcion: 'Demo',
      });

      expect(store).toEqual({
        id: 't-1',
        vendorId: 'v-1',
        name: 'Mi Tienda',
        description: 'Demo',
      });
    });

    it('debe devolver null si no hay id o el valor no es válido', () => {
      expect(adaptStoreFromBackend(null)).toBeNull();
      expect(adaptStoreFromBackend({ nombre: 'Sin id' })).toBeNull();
    });
  });

  describe('adaptStorefrontFromBackend', () => {
    it('debe mapear tienda y ofertas de Core Engine', () => {
      const { store, products } = adaptStorefrontFromBackend({
        tienda: { id: 't-1', nombre: 'Mi Tienda', vendedor_id: 'v-1' },
        ofertas: [
          {
            id: 'of-1',
            producto_nombre: 'Teclado',
            precio_venta: '1380.00',
            stock: 10,
            sku: 'SKU-1',
          },
        ],
      });

      expect(store?.name).toBe('Mi Tienda');
      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({ id: 'of-1', name: 'Teclado', price: 1380, stock: 10 });
    });

    it('debe tolerar respuestas sin tienda ni ofertas', () => {
      const { store, products } = adaptStorefrontFromBackend(null);

      expect(store).toBeNull();
      expect(products).toEqual([]);
    });

    it('debe enriquecer las ofertas con el catálogo (por producto_id y sku)', () => {
      const catalog = buildCatalogLookup({
        items: [
          { id: 'p-1', sku: 'SKU-TEC', descripcion: 'Teclado RGB', categoria: 'Periféricos' },
        ],
      });

      const { products } = adaptStorefrontFromBackend(
        {
          tienda: { id: 't-1' },
          ofertas: [
            { id: 'of-1', producto_id: 'p-1', producto_nombre: 'Teclado', precio_venta: '100.00' },
            { id: 'of-2', sku: 'SKU-TEC', producto_nombre: 'Teclado 2', precio_venta: '120.00' },
            { id: 'of-3', producto_nombre: 'Sin catálogo', precio_venta: '10.00', sku: 'SKU-X' },
          ],
        },
        {
          items: [
            { id: 'p-1', sku: 'SKU-TEC', descripcion: 'Teclado RGB', categoria: 'Periféricos' },
          ],
        },
      );

      expect(catalog.get('p-1')?.category).toBe('Periféricos');
      expect(products[0]).toMatchObject({ description: 'Teclado RGB', category: 'Periféricos' });
      expect(products[1]).toMatchObject({ description: 'Teclado RGB', category: 'Periféricos' });
      expect(products[2]).toMatchObject({ description: 'SKU SKU-X', category: 'General' });
    });
  });
});
