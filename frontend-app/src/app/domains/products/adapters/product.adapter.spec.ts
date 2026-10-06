import {
  adaptProductFromBackend,
  adaptProductListFromBackend,
  adaptSingleProductFromBackend,
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
});
