/** Modalidad logística de una empresa (`modalidad_logistica` en Core Engine). */
export type LogisticsMode = 'plataforma' | 'propia' | 'hibrida';

/** Empresa (tenant comercial) tal como la expone `EmpresaResponseDto`. */
export interface Company {
  id: string;
  name: string;
  /** Identificador público estable; nunca sustituye al id interno en API/RLS. */
  slug?: string;
  logisticsMode: LogisticsMode;
  status: string;
  createdBy: string;
  createdAt: string;
}

/** Alta de empresa (`POST /empresas`). */
export interface CreateCompanyData {
  name: string;
  logisticsMode: LogisticsMode;
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
  logisticsOwnership?: 'company' | 'store';
}

/** Datos para crear un vendedor con participación predeterminada. */
export interface CreateCompanySellerData {
  name: string;
  email: string;
  password: string;
  participationPercentage: number;
  storeId?: string;
  permissions?: readonly string[];
  logisticsOwnership?: 'company' | 'store';
}
