import type { Shipment } from '../../models/envio.model';

export interface EnviosState {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  /** Filtro por estado de la lista (`''` = todas). */
  statusFilter: string;
  /** Envío con asignación en curso. */
  assigningId: string | null;
  /** Envío con cambio de estado en curso. */
  advancingId: string | null;
}
