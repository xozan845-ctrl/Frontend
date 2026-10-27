/** Filas por página en la tabla de clientes. */
export const CLIENT_PAGE_SIZE = 10;

/** Compras necesarias para considerar frecuente a un cliente. */
export const CLIENT_FREQUENT_ORDERS = 3;

/** Ventana en días para considerar activo a un cliente. */
export const CLIENT_ACTIVE_DAYS = 30;

/** Tamaño máximo aceptado para un CSV de clientes (2 MB). */
export const CLIENT_IMPORT_MAX_BYTES = 2_000_000;

/**
 * Clave de storage aislada por ámbito (empresa o vendedor).
 * Mantiene el prefijo histórico `ecom_company_clients_<tenant>` para no perder
 * los registros locales ya guardados por el panel empresarial.
 */
export function clientsStorageKey(scope: string, id?: string | number | null): string {
  const suffix =
    (id !== undefined && id !== null ? String(id) : 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_${scope}_clients_${suffix}`;
}
