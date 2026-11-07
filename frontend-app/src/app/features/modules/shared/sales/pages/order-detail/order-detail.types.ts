import type { OrderStatus } from '../../../../../domains/store-sales/public-api';

/** Paso del avance del pedido para la línea de tiempo (estados finales aparte). */
export interface TimelineStep {
  status: OrderStatus;
  label: string;
}
