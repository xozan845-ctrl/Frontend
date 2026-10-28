/**
 * Fixture de contrato versionado (R-C-8): respuesta realista del API del backend
 * (envelope `{ data, meta }`, `snake_case`, tipos string numéricos).
 * No se actualiza contra el backend en vivo: si cambia el shape, este fixture
 * y `product.contract.spec.ts` cambian en el mismo PR.
 */
export const PRODUCT_LIST_ENVELOPE_FIXTURE = {
  data: [
    {
      product_id: 101,
      product_name: 'Auriculares Quantum X',
      description: 'Cancelación activa de ruido y 40 h de batería.',
      unit_price: '299.90',
      compare_at_price: '349.90',
      image_url: 'https://cdn.example.com/products/auriculares-x.jpg',
      gallery: [
        'https://cdn.example.com/products/auriculares-x-1.jpg',
        'https://cdn.example.com/products/auriculares-x-2.jpg',
      ],
      category: { id: 7, name: 'Audio' },
      stock_quantity: 12,
      variants: { colors: [{ name: 'Negro', hex: '#000000' }], specs: ['Bluetooth 5.3'] },
    },
    {
      id: 102,
      title: 'Teclado Mecánico Q',
      price: 149.5,
      thumbnail: 'https://cdn.example.com/products/teclado-q.jpg',
      category_name: 'Periféricos',
      inventory: 0,
      in_stock: false,
    },
  ],
  meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
} as const;

export const PRODUCT_SINGLE_ENVELOPE_FIXTURE = {
  data: {
    id: 'sku-200',
    name: 'Monitor UltraWide 34',
    description: '34" 144 Hz con HDR.',
    price: 899,
    image: 'https://cdn.example.com/products/monitor-uw.jpg',
    category: 'Monitores',
    stock: 5,
  },
} as const;

/**
 * `TiendaPublicaResponseDto` real (`GET /tiendas/:id`): tienda con contexto de
 * empresa y ofertas con precios decimales.
 */
export const TIENDA_PUBLICA_FIXTURE = {
  tienda: {
    id: 'dc81527d-78ae-4bbc-bf69-0d884186a29a',
    empresa_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
    propietario_usuario_id: 'e9aa395b-1654-48b0-befe-fbe38538a408',
    participacion_porcentaje: 100,
    vendedor_id: 'e9aa395b-1654-48b0-befe-fbe38538a408',
    nombre: 'Tienda Ofertas',
    descripcion: 'Productos de la empresa',
    creado_en: '2026-10-21T21:20:00.000Z',
  },
  ofertas: [
    {
      id: 'be644b6e-ef1d-49d2-a79c-4077c2d77a07',
      tienda_id: 'dc81527d-78ae-4bbc-bf69-0d884186a29a',
      producto_id: 'c13a201e-060e-4f05-87ae-2e24871b95b2',
      sku: 'SKU-OF-1',
      producto_nombre: 'Producto Oferta',
      margen: 25,
      precio_base: '100.00',
      precio_venta: '125.00',
      stock: 10,
      estado: 'activa',
      creado_en: '2026-10-21T21:20:00.000Z',
    },
  ],
} as const;
