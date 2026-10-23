import type { Ruta } from '../../models/ruta.model';

export interface RutasState {
  routes: Ruta[];
  loading: boolean;
  error: string | null;
  selectedRouteId: string | null;
  /** Ruta con un cambio de estado en curso. */
  savingRouteId: string | null;
  /** Parada con un cambio en curso. */
  savingStopId: string | null;
}
