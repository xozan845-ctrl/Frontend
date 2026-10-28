import type { CompanyCatalogSort } from './company-catalog.model';

/** Estado visible de un servicio de la empresa. */
export type CompanyServiceStatus = 'activo' | 'inactivo';

/**
 * Servicio ofrecido por la empresa. Mientras Core Engine no exponga un
 * endpoint de servicios, se persiste localmente por tenant (ADR-52/55).
 */
export interface CompanyService {
  id: string;
  companyId: string;
  /** Código interno del servicio (equivalente al SKU de un producto). */
  code: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  barcode: string;
  /** Precio de venta en córdobas. */
  price: number;
  /** Costo estimado en córdobas. */
  cost: number;
  /** Unidad de venta (ej. "Hora (h)"). */
  unit: string;
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
  brand?: string;
  barcode?: string;
  /** Precio decimal como string (ej. "1500.00"). */
  price: string;
  /** Costo decimal como string (ej. "500.00"). */
  cost?: string;
  unit?: string;
  durationMinutes: number;
  status?: CompanyServiceStatus;
}

/** Datos editables de un servicio; el código se mantiene inmutable. */
export interface UpdateCompanyServiceData {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  /** Precio decimal como string (ej. "1500.00"). */
  price?: string;
  /** Costo decimal como string (ej. "500.00"). */
  cost?: string;
  unit?: string;
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
  brand?: string;
  status?: CompanyServiceStatus | null;
  sort?: CompanyCatalogSort;
}
