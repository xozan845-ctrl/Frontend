/** Modalidad logística de una empresa (`modalidad_logistica` en Core Engine). */
export type LogisticsMode = 'plataforma' | 'propia' | 'hibrida';

/**
 * Tipo de empresa (`tipo_empresa` en Core Engine). Solo las comerciales tienen
 * catálogo propio (ADR-27).
 */
export type CompanyType = 'comercial' | 'logistica' | 'plataforma';

/** Metadatos comerciales, fiscales y de contacto de la empresa. */
export interface CompanyProfileData {
  /** RUC opcional (`ruc`). */
  taxId?: string;
  /** Razón social fiscal (`razon_social`). */
  legalName?: string;
  /** Nombre comercial visible (`nombre_comercial`). */
  commercialName?: string;
  /** Descripción pública de la empresa. */
  description?: string;
  phone?: string;
  contactEmail?: string;
  website?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  /** Moneda ISO 4217 de tres letras (`moneda`). */
  currency?: string;
  /** Zona horaria IANA (`zona_horaria`). */
  timezone?: string;
  sector?: string;
  legalRepresentative?: string;
  /** Horario de atención en texto libre. */
  businessHours?: string;
  /** UUID del objeto de storage confirmado como imagen pública (`logo_objeto_id`). */
  logoObjectId?: string | null;
}

/** Empresa (tenant comercial) tal como la expone `EmpresaResponseDto`. */
export interface Company extends CompanyProfileData {
  id: string;
  name: string;
  /** Identificador público estable; nunca sustituye al id interno en API/RLS. */
  slug?: string;
  logisticsMode: LogisticsMode;
  type: CompanyType;
  status: string;
  createdBy: string;
  createdAt: string;
  /** URL pública derivada del logo por el backend (`logo_url`). */
  logoUrl?: string | null;
  updatedAt?: string;
}

/** Alta de empresa (`POST /empresas`). */
export interface CreateCompanyData extends CompanyProfileData {
  name: string;
  /** Slug público; si se omite el backend lo deriva del nombre. */
  slug?: string;
  logisticsMode: LogisticsMode;
  /** Clasificación inicial; el backend usa `comercial` por defecto. */
  type?: CompanyType;
}

/** Vendedor creado dentro de una empresa (`POST /empresas/:id/vendedores`). */
export interface CompanySeller {
  id: string;
  name: string;
  email: string;
  role: string;
  participationPercentage: number;
  /** Tienda que el empresario delegó a este vendedor. */
  storeId?: string;
  storeName?: string;
  permissions?: readonly string[];
  logisticsOwnership?: 'company' | 'store' | 'logistics_company';
}

/** Datos para crear un vendedor con participación predeterminada. */
export interface CreateCompanySellerData {
  name: string;
  email: string;
  password: string;
  participationPercentage: number;
  storeId?: string;
  permissions?: readonly string[];
  logisticsOwnership?: 'company' | 'store' | 'logistics_company';
}
