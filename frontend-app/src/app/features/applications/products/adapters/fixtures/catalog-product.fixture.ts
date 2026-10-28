/** `ProductoResponseDto` real del catálogo. */
export const CATALOG_PRODUCT_FIXTURE = {
  id: 'c13a201e-060e-4f05-87ae-2e24871b95b2',
  empresa_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
  sku: 'SKU-001',
  nombre: 'Teclado Mecánico',
  descripcion: 'Teclado con switches táctiles.',
  categoria: 'Periféricos',
  precio_base: '1000.00',
  stock: 10,
  estado: 'disponible',
  creado_en: '2026-10-21T00:00:00.000Z',
} as const;

/** `PaginaProductosResponseDto` real con metadatos de paginación. */
export const CATALOG_PRODUCTS_PAGE_FIXTURE = {
  items: [
    CATALOG_PRODUCT_FIXTURE,
    {
      id: 'p-2',
      empresa_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
      sku: 'SKU-002',
      nombre: 'Mouse Gamer',
      descripcion: '',
      categoria: 'Periféricos',
      precio_base: 50,
      stock: '0',
      estado: 'agotado',
      creado_en: '2026-10-20T00:00:00.000Z',
    },
  ],
  total: '12',
  pagina: '1',
  limite: '10',
  paginas: '2',
} as const;
