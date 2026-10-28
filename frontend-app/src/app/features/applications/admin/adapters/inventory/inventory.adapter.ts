import { unwrapApiListResponse } from '../../../../../core/models/api-response.dto';
import { BackendInventoryLineDTO } from '../../models/inventory.dto';
import { InventoryLine } from '../../models/inventory.model';

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toCount(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function toAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Normaliza una línea de inventario (`LineaInventarioResponseDto`). Las líneas
 * sin SKU se descartan porque el SKU es la clave de la tabla.
 */
export function adaptInventoryLineFromBackend(raw: unknown): InventoryLine | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const line = raw as BackendInventoryLineDTO;
  const sku = toText(line.sku, '');
  if (!sku) return null;

  return {
    sku,
    name: toText(line.nombre, 'Producto'),
    stock: toCount(line.stock),
    available: toCount(line.disponible),
    reserved: toCount(line.reservado ?? line.reservas_activas),
    status: toText(line.estado, 'disponible'),
    basePrice: toAmount(line.precio_base ?? line.precioBase),
    availableValueCents: toCount(line.valor_disponible_cents ?? line.valorDisponibleCents),
    totalValueCents: toCount(line.valor_total_cents ?? line.valorTotalCents),
  };
}

/** Lista de inventario tolerante a array directo o envelopes `{ data }`/`{ items }`. */
export function adaptInventoryFromBackend(response: unknown): InventoryLine[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptInventoryLineFromBackend(raw))
    .filter((line): line is InventoryLine => line !== null);
}
