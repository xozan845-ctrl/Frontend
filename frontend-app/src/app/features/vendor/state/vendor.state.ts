import type {
  Client,
  OrderDraftInfo,
  OrderDraftLine,
  OrderStatus,
  VendorOrder,
  VendorProduct,
} from '../models/vendor-order.model';

export interface ClientSearchState {
  query: string;
  results: Client[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  /** Cliente recién creado; el contenedor lo selecciona y luego lo reconoce. */
  lastCreated: Client | null;
}

export interface OrderDraftState {
  client: Client | null;
  info: OrderDraftInfo;
  lines: OrderDraftLine[];
  discountPercent: number;
  observations: string;
  submitting: boolean;
  error: string | null;
  /** Último pedido registrado con éxito; la pantalla lo usa para refrescar recientes. */
  lastCreatedOrder: VendorOrder | null;
}

export interface VendorCatalogState {
  products: VendorProduct[];
  loading: boolean;
  error: string | null;
  /** Término del buscador del POS (por nombre o código). */
  query: string;
  /** Categoría activa; `null` = todas. */
  category: string | null;
}

export interface VendorOrdersState {
  orders: VendorOrder[];
  loading: boolean;
  error: string | null;
  /** Marca de tiempo (ms) de la última carga lograda; alimenta "Actualizado …". */
  lastUpdatedAt: number | null;
  /** Modo "en vivo": sondeo activo que se pausa con la pestaña oculta. */
  live: boolean;
  /** Filtro por estado de la lista completa; `null` equivale a "Todas". */
  statusFilter: OrderStatus | null;
  /** Pedido abierto en la página de detalle (`pedidos/:id`). */
  selectedOrder: VendorOrder | null;
  selectedLoading: boolean;
  selectedError: string | null;
  /** Cambio de estado en curso; deshabilita las acciones del detalle. */
  updatingStatus: boolean;
}

/** KPIs del inicio del panel: venta de hoy y trabajo por atender. */
export interface VendorTodayKpis {
  /** Suma de los pedidos creados hoy, sin contar cancelados. */
  soldToday: number;
  /** Pedidos creados hoy (cualquier estado). */
  ordersToday: number;
  /** Pedidos pendientes por atender (histórico cargado). */
  pending: number;
  /** Pedidos en proceso (histórico cargado). */
  inProgress: number;
}
