/** Estado común de la lista y el detalle de pedidos. */
export interface OrdersState<T extends { id: string | number }> {
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

/** Mensajes que cada workspace puede adaptar a su vocabulario (ventas/pedidos). */
export interface OrdersFeatureOptions {
  loadErrorMessage?: string;
  detailErrorMessage?: string;
  updateErrorMessage?: string;
  updateSuccessMessage?: (orderId: string) => string;
}
