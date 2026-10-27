/** Clave base de los servicios locales; se sufija con el tenant activo. */
export const COMPANY_SERVICES_STORAGE_KEY = 'ecom_company_services';

/** Servicios por página en la tabla del workspace. */
export const COMPANY_SERVICE_PAGE_SIZE = 8;

/** Tope defensivo de servicios guardados por empresa. */
export const COMPANY_SERVICE_MAX_RECORDS = 500;

/** Duración máxima aceptada para un servicio (una semana en minutos). */
export const COMPANY_SERVICE_MAX_DURATION_MINUTES = 10_080;

/** Clave de storage aislada por empresa; sin tenant usa un espacio seguro. */
export function companyServicesStorageKey(tenantId?: string | null): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `${COMPANY_SERVICES_STORAGE_KEY}_${suffix}`;
}
