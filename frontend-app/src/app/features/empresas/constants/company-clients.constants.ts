/** Clave base de la cartera local; se sufija con el tenant activo. */
export const COMPANY_CLIENTS_STORAGE_KEY = 'ecom_company_clients';

/** Filas por página en la tabla de clientes. */
export const COMPANY_CLIENT_PAGE_SIZE = 10;

/** Compras necesarias para considerar frecuente a un cliente. */
export const COMPANY_CLIENT_FREQUENT_ORDERS = 3;

/** Ventana en días para considerar activo a un cliente. */
export const COMPANY_CLIENT_ACTIVE_DAYS = 30;

/** Tamaño máximo aceptado para un CSV de clientes (2 MB). */
export const COMPANY_CLIENT_IMPORT_MAX_BYTES = 2_000_000;

/** Clave de storage aislada por empresa; sin tenant usa un espacio seguro. */
export function companyClientsStorageKey(tenantId?: string | null): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `${COMPANY_CLIENTS_STORAGE_KEY}_${suffix}`;
}
