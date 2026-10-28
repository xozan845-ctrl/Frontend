import { unwrapApiListResponse } from '../../../../../core/models/api-response.dto';
import { BackendIncidenciaDTO } from '../../models/incidencia.dto';
import { FieldIncident } from '../../models/incidencia.model';

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Normaliza una incidencia; `null` si no tiene id. */
export function adaptIncidenciaFromBackend(raw: unknown): FieldIncident | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const incident = raw as BackendIncidenciaDTO;
  if (!incident.id) return null;

  return {
    id: String(incident.id),
    type: toText(incident.tipo) || 'otro',
    status: toText(incident.estado) || 'abierta',
    description: toText(incident.descripcion),
    personalId: toText(incident.personal_id ?? incident.personalId) || null,
    vehicleId: toText(incident.vehiculo_id ?? incident.vehiculoId) || null,
    routeId: toText(incident.ruta_id ?? incident.rutaId) || null,
    resolution: toText(incident.resolucion),
    createdAt: toText(incident.creado_en ?? incident.creadoEn ?? incident.created_at),
    updatedAt: toText(incident.actualizado_en ?? incident.actualizadoEn ?? incident.updated_at),
  };
}

/** Lista de incidencias tolerante a array directo o envelopes. */
export function adaptIncidenciasFromBackend(response: unknown): FieldIncident[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptIncidenciaFromBackend(raw))
    .filter((incident): incident is FieldIncident => incident !== null);
}
