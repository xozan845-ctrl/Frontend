/** Origen de un cliente de la cartera. */
export type ClientSource = 'order' | 'manual' | 'import';

/** Vistas principales de la página de clientes. */
export type ClientsTab = 'list' | 'top' | 'frequent' | 'inactive';

/** Filtros rápidos de la tabla de clientes. */
export type ClientChip =
  'all' | 'active' | 'inactive' | 'frequent' | 'new' | 'with-orders' | 'without-orders';

/** Estado visible de un cliente dentro de la cartera. */
export type ClientStatus = 'activo' | 'nuevo' | 'frecuente' | 'inactivo' | 'sin_compras';

/** Datos mínimos para registrar o importar un cliente. */
export interface CreateClientPayload {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  /** Identificador del comprador en Core Engine; permite vincular compras. */
  buyerId?: string;
}

/** Fila válida leída de un CSV de clientes. */
export type ClientImportRow = CreateClientPayload;

/**
 * Cliente persistido localmente mientras Core Engine no exponga un endpoint de
 * clientes. Los clientes derivados de órdenes no se persisten.
 */
export interface ClientRecord {
  id: string;
  buyerId?: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  source: ClientSource;
  createdAt: string;
}

/** Cliente de la cartera con métricas de compra derivadas de sus órdenes. */
export interface Client extends ClientRecord {
  ordersCount: number;
  totalSpent: number;
  averageTicket: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  isActive: boolean;
  isNew: boolean;
  isFrequent: boolean;
  isInactive: boolean;
  status: ClientStatus;
}

/** Indicadores del encabezado de la cartera de clientes. */
export interface ClientKpis {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
  topClient: Client | null;
  totalGenerated: number;
  averageTicket: number;
  totalOrders: number;
}

/** Resultado de registrar un cliente en la cartera local. */
export interface ClientMutationResult {
  ok: boolean;
  message?: string;
  clientId?: string;
}

/** Resultado de importar un CSV de clientes. */
export interface ClientImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Resultado de leer y validar un CSV de clientes. */
export interface ClientCsvParseResult {
  rows: ClientImportRow[];
  errors: string[];
}

/** Orden mínima que alimenta la cartera de clientes (empresa o vendedor). */
export interface ClientOrder {
  id: string | number;
  buyerId?: string;
  status: string;
  total: number;
  /** ISO 8601 UTC. */
  createdAt: string;
}
