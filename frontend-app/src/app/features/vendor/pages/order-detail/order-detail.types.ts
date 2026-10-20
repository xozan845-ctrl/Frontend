import type { OrderStatus } from '../../models/vendor-order.model';

/** Paso del avance del pedido para la línea de tiempo (estados finales aparte). */
export interface TimelineStep {
  status: OrderStatus;
  label: string;
}
