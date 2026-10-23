import { unwrapApiListResponse } from '../../../../core/models/api-response.dto';
import { BackendPersonalDTO } from '../../models/personal.dto';
import { FieldEmployee } from '../../models/personal.model';

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Normaliza un colaborador de campo; `null` si no tiene id. */
export function adaptPersonalFromBackend(raw: unknown): FieldEmployee | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const employee = raw as BackendPersonalDTO;
  if (!employee.id) return null;

  return {
    id: String(employee.id),
    name: toText(employee.nombre),
    lastName: toText(employee.apellido),
    cargo: toText(employee.cargo),
    status: toText(employee.estado) || 'activo',
    phone: toText(employee.telefono),
    email: toText(employee.email),
    assignedRouteId: toText(employee.ruta_asignada_id ?? employee.rutaAsignadaId) || null,
    assignedVehicleId: toText(employee.vehiculo_asignado_id ?? employee.vehiculoAsignadoId) || null,
    checkIn: toText(employee.hora_check_in ?? employee.horaCheckIn) || null,
    checkOut: toText(employee.hora_check_out ?? employee.horaCheckOut) || null,
    lat: toNumber(employee.ubicacion_lat ?? employee.ubicacionLat),
    lng: toNumber(employee.ubicacion_lng ?? employee.ubicacionLng),
    locationTimestamp: toText(employee.ubicacion_ts ?? employee.ubicacionTs) || null,
    createdAt: toText(employee.creado_en ?? employee.creadoEn ?? employee.created_at),
    updatedAt: toText(employee.actualizado_en ?? employee.actualizadoEn ?? employee.updated_at),
  };
}

/** Lista de personal tolerante a array directo o envelopes. */
export function adaptPersonalListFromBackend(response: unknown): FieldEmployee[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptPersonalFromBackend(raw))
    .filter((employee): employee is FieldEmployee => employee !== null);
}
