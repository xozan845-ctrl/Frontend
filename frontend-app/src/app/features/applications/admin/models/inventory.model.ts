/** Línea de inventario de bodega (`LineaInventarioResponseDto`). */
export interface InventoryLine {
  sku: string;
  name: string;
  /** Stock físico en bodega. */
  stock: number;
  /** Stock disponible (neto de reservas). */
  available: number;
  /** Unidades reservadas por órdenes activas. */
  reserved: number;
  status: string;
  /** Precio base en córdobas. */
  basePrice: number;
  /** Valor del stock disponible en centavos. */
  availableValueCents: number;
  /** Valor del stock físico total en centavos. */
  totalValueCents: number;
}
