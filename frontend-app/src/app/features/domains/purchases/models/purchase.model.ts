/** Origen de una compra: mercancía inventariable o gasto directo. */
export type PurchaseOrigin = 'productos' | 'directa';

/** Estado del documento de compra. */
export type PurchaseStatus = 'recibida' | 'pendiente' | 'anulada';

/** Filtro de estado usado en el historial. */
export type PurchaseStatusFilter = 'todas' | PurchaseStatus;

/** Periodo rápido del historial y de los reportes. */
export type PurchasePeriod = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';

/** Formas de pago admitidas en compras. */
export type PurchasePaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito' | 'otro';

/** Tipo de costo para la contabilidad. */
export type PurchaseCostType = 'inventario' | 'servicio' | 'gasto' | 'otro';

/** Tamaño del logo en los documentos imprimibles. */
export type PurchaseLogoSize = 'pequeno' | 'mediano' | 'grande';

/** Estado de una orden de compra (solicitud al proveedor). */
export type PurchaseOrderStatus = 'pendiente' | 'convertida' | 'anulada';

/** Línea de producto o servicio dentro de una compra. */
export interface PurchaseLine {
  id: string;
  /** Id del producto del catálogo; `null` si es un gasto directo. */
  productId: string | null;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  salePrice: number | null;
}

/** Compra registrada. */
export interface PurchaseRecord {
  id: string;
  number: string;
  /** Fecha local en `yyyy-mm-dd`. */
  date: string;
  supplierId: string | null;
  supplierName: string;
  paymentMethod: PurchasePaymentMethod;
  status: PurchaseStatus;
  origin: PurchaseOrigin;
  costType: PurchaseCostType;
  lines: readonly PurchaseLine[];
  subtotal: number;
  /** Retención de IR aplicada al proveedor (informativa). */
  retention: number;
  total: number;
  notes: string;
  userName: string;
  createdAt: string;
}

/** Orden de compra: solicitud que todavía no afecta caja ni inventario. */
export interface PurchaseOrder {
  id: string;
  number: string;
  date: string;
  supplierId: string | null;
  supplierName: string;
  lines: readonly PurchaseLine[];
  total: number;
  status: PurchaseOrderStatus;
  notes: string;
  createdAt: string;
}

/** Proveedor administrado por la empresa. */
export interface Supplier {
  id: string;
  name: string;
  ruc: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

/** Preferencias de los documentos imprimibles (órdenes y reportes). */
export interface PurchaseDocumentSettings {
  logoSize: PurchaseLogoSize;
  headerColor: string;
  matchTableColor: boolean;
  footerMessage: string;
  showRuc: boolean;
  showAddress: boolean;
  showPhone: boolean;
}

/** Línea capturada por la UI antes de validar. */
export interface PurchaseLineInput {
  productId?: string | null;
  name: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  salePrice?: number | null;
}

/** Alta de compra desde el asistente. */
export interface CreatePurchaseInput {
  date: string;
  supplierId?: string | null;
  supplierName?: string;
  paymentMethod: PurchasePaymentMethod;
  status: PurchaseStatus;
  origin: PurchaseOrigin;
  costType: PurchaseCostType;
  lines: readonly PurchaseLineInput[];
  notes?: string;
  retention?: number;
  userName?: string;
}

/** Alta de compra directa (gasto no inventariable). */
export interface CreateDirectPurchaseInput {
  date: string;
  supplierId?: string | null;
  supplierName?: string;
  concept: string;
  costType: PurchaseCostType;
  amount: number;
  paymentMethod: PurchasePaymentMethod;
  notes?: string;
  retention?: number;
  userName?: string;
}

/** Alta de producto nuevo comprado y agregado al inventario. */
export interface CreateNewProductPurchaseInput {
  date: string;
  supplierId?: string | null;
  supplierName?: string;
  productName: string;
  category?: string;
  sku?: string;
  paymentMethod: PurchasePaymentMethod;
  unitCost: number;
  salePrice: number;
  quantity: number;
  notes?: string;
  userName?: string;
}

/** Alta de orden de compra. */
export interface CreateOrderInput {
  date: string;
  supplierId?: string | null;
  supplierName?: string;
  lines: readonly PurchaseLineInput[];
  notes?: string;
}

/** Alta de proveedor. */
export interface CreateSupplierInput {
  name: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/** Indicadores superiores de la página de compras. */
export interface PurchaseKpis {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  totalCount: number;
  cancelledCount: number;
  productsEntered: number;
  inventoryInvestment: number;
  activeSuppliers: number;
}

/** Fila lista para la tabla del historial. */
export interface PurchaseHistoryRow {
  id: string;
  number: string;
  date: string;
  supplierName: string;
  productsLabel: string;
  units: number;
  total: number;
  paymentLabel: string;
  status: PurchaseStatus;
  statusLabel: string;
  userName: string;
  isCancelled: boolean;
}

/** Fila lista para la tabla de proveedores. */
export interface SupplierRow {
  id: string;
  name: string;
  ruc: string;
  contact: string;
  purchaseCount: number;
  total: number;
  lastPurchaseDate: string;
}

/** Fila lista para la tabla de órdenes de compra. */
export interface PurchaseOrderRow {
  id: string;
  number: string;
  date: string;
  supplierName: string;
  productsLabel: string;
  units: number;
  total: number;
  status: PurchaseOrderStatus;
  statusLabel: string;
}

/** Opciones del panel de exportación. */
export interface PurchaseReportOptions {
  period: PurchasePeriod;
  customFrom: string;
  customTo: string;
  status: 'activas' | 'anuladas' | 'todas';
  type: 'todas' | 'productos' | 'directas';
  payment: 'todas' | PurchasePaymentMethod;
  includeProducts: boolean;
  supplierIds: readonly string[];
}

/** Filtros combinados del historial y del reporte. */
export interface PurchaseFilters {
  period: PurchasePeriod;
  customFrom?: string;
  customTo?: string;
  status?: 'todas' | 'activas' | 'anuladas' | PurchaseStatusFilter;
  query?: string;
  type?: 'todas' | 'productos' | 'directas';
  payment?: 'todas' | PurchasePaymentMethod;
  supplierIds?: readonly string[];
  supplierNames?: readonly string[];
  now?: Date;
}

/** Resumen calculado del reporte antes de exportar. */
export interface PurchaseReport {
  rows: readonly PurchaseRecord[];
  count: number;
  total: number;
  units: number;
  productLines: readonly { name: string; quantity: number; total: number }[];
}

/** Resultado de una mutación del store. */
export interface PurchaseMutationResult {
  ok: boolean;
  message?: string;
}

/** Producto mínimo que necesita el asistente de compra. */
export interface PurchaseProductOption {
  id: string;
  name: string;
  code: string;
  category: string;
  cost: number;
  price: number;
  stock: number | null;
}
