/** Pestañas del apartado "Productos / Servicios" del workspace de empresa. */
export type CompanyCatalogTab = 'productos' | 'servicios';

/** Estado visible de un servicio de la empresa. */
export type CompanyServiceStatus = 'activo' | 'inactivo';

/**
 * Servicio ofrecido por la empresa. Mientras Core Engine no exponga un
 * endpoint de servicios, se persiste localmente por tenant (ADR-52).
 */
export interface CompanyService {
  id: string;
  companyId: string;
  /** Código interno del servicio (equivalente al SKU de un producto). */
  code: string;
  name: string;
  description: string;
  category: string;
  /** Precio en córdobas. */
  price: number;
  /** Duración estimada en minutos. */
  durationMinutes: number;
  status: CompanyServiceStatus;
  /** ISO 8601 UTC. */
  createdAt: string;
  /** ISO 8601 UTC. */
  updatedAt: string;
}

/** Datos para registrar un servicio desde el formulario. */
export interface CreateCompanyServiceData {
  code: string;
  name: string;
  description?: string;
  category?: string;
  /** Precio decimal como string (ej. "1500.00"). */
  price: string;
  durationMinutes: number;
  status?: CompanyServiceStatus;
}

/** Datos editables de un servicio; el código se mantiene inmutable. */
export interface UpdateCompanyServiceData {
  name?: string;
  description?: string;
  category?: string;
  /** Precio decimal como string (ej. "1500.00"). */
  price?: string;
  durationMinutes?: number;
  status?: CompanyServiceStatus;
}

/** Resultado de una mutación local; la página explica el motivo si falla. */
export interface CompanyServiceMutationResult {
  ok: boolean;
  message?: string;
  service?: CompanyService;
}

/** Filtros locales del listado de servicios. */
export interface CompanyServiceFilters {
  search?: string;
  category?: string;
  status?: CompanyServiceStatus | null;
}
