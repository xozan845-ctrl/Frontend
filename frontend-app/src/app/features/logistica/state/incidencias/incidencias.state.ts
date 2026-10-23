import type { FieldIncident } from '../../models/incidencia.model';

export interface IncidenciasState {
  incidents: FieldIncident[];
  loading: boolean;
  error: string | null;
  selectedIncidentId: string | null;
  statusFilter: string | null;
  savingId: string | null;
}
