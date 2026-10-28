import type { OrderStatus } from '../../../../applications/vendor/public-api';

/** Paso del avance del pedido para la línea de tiempo (estados finales aparte). */
export interface TimelineStep {
  status: OrderStatus;
  label: string;
}
