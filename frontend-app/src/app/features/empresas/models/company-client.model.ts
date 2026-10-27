/** Origen de un cliente de la cartera de la empresa. */
export type CompanyClientSource = 'order' | 'manual' | 'import';

/** Vistas principales de la página de clientes. */
export type CompanyClientsTab = 'list' | 'top' | 'frequent' | 'inactive';

/** Filtros rápidos de la tabla de clientes. */
export type CompanyClientChip =
  'all' | 'active' | 'inactive' | 'frequent' | 'new' | 'with-orders' | 'without-orders';

/** Estado visible de un cliente dentro de la cartera. */
export type CompanyClientStatus = 'activo' | 'nuevo' | 'frecuente' | 'inactivo' | 'sin_compras';

/** Datos mínimos para registrar o importar un cliente. */
export interface CreateCompanyClientPayload {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  /** Identificador del comprador en Core Engine; permite vincular compras. */
  buyerId?: string;
}

/** Fila válida leída de un CSV de clientes. */
export type CompanyClientImportRow = CreateCompanyClientPayload;

/**
 * Cliente persistido localmente mientras Core Engine no exponga un endpoint de
 * clientes de empresa. Los clientes derivados de órdenes no se persisten.
 */
export interface CompanyClientRecord {
  id: string;
  buyerId?: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  source: CompanyClientSource;
  createdAt: string;
}

/** Cliente de la cartera con métricas de compra derivadas de sus órdenes. */
export interface CompanyClient extends CompanyClientRecord {
  ordersCount: number;
  totalSpent: number;
  averageTicket: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  isActive: boolean;
  isNew: boolean;
  isFrequent: boolean;
  isInactive: boolean;
  status: CompanyClientStatus;
}

/** Indicadores del encabezado de la cartera de clientes. */
export interface CompanyClientKpis {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
  topClient: CompanyClient | null;
  totalGenerated: number;
  averageTicket: number;
  totalOrders: number;
}

/** Resultado de registrar un cliente en la cartera local. */
export interface CompanyClientMutationResult {
  ok: boolean;
  message?: string;
  clientId?: string;
}

/** Resultado de importar un CSV de clientes. */
export interface CompanyClientImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Resultado de leer y validar un CSV de clientes. */
export interface CompanyClientCsvParseResult {
  rows: CompanyClientImportRow[];
  errors: string[];
}
