/** `LineaInventarioResponseDto` de Core Engine. */
export interface BackendInventoryLineDTO {
  sku?: string | null;
  nombre?: string | null;
  stock?: number | string | null;
  disponible?: number | string | null;
  reservado?: number | string | null;
  estado?: string | null;
  precio_base?: number | string | null;
  precioBase?: number | string | null;
  reservas_activas?: number | string | null;
  valor_disponible_cents?: number | string | null;
  valorDisponibleCents?: number | string | null;
  valor_total_cents?: number | string | null;
  valorTotalCents?: number | string | null;
}
