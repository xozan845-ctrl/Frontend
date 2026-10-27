/** Estado común de la lista y el detalle de pedidos. */
export interface OrdersState<T extends { id: string }> {
  orderRecords: T[];
  loading: boolean;
  error: string | null;
  /** Marca de tiempo (ms) de la última carga lograda. */
  lastUpdatedAt: number | null;
  selectedRecord: T | null;
  selectedLoading: boolean;
  selectedError: string | null;
  /** Cambio de estado en curso; deshabilita las acciones del detalle. */
  updatingStatus: boolean;
}
