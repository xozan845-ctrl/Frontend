/** `LineaInventarioResponseDto[]` real de `GET /admin/inventario`. */
export const INVENTORY_FIXTURE = [
  {
    sku: 'SKU-001',
    nombre: 'Teclado Mecánico',
    stock: 12,
    disponible: 10,
    reservado: 2,
    estado: 'disponible',
    precio_base: '1000.00',
    reservas_activas: 2,
    valor_disponible_cents: 1000000,
    valor_total_cents: 1200000,
  },
  {
    sku: 'SKU-002',
    nombre: 'Mouse Gamer',
    stock: '0',
    disponible: '0',
    reservado: 0,
    estado: 'agotado',
    precio_base: 50,
    reservas_activas: 0,
    valor_disponible_cents: 0,
    valor_total_cents: 0,
  },
] as const;
