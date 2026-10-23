import { unwrapApiListResponse } from '../../../../core/models/api-response.dto';
import { BackendParadaDTO, BackendRutaDTO } from '../../models/ruta.dto';
import { Parada, Ruta } from '../../models/ruta.model';

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toOrder(value: unknown): number {
  const parsed = toNumber(value);
  return parsed === null ? 0 : Math.max(0, Math.round(parsed));
}

function toPersonalIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}

/** Normaliza una parada; `null` si no tiene id. */
export function adaptParadaFromBackend(raw: unknown, routeId = ''): Parada | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const stop = raw as BackendParadaDTO;
  if (!stop.id) return null;

  return {
    id: String(stop.id),
    routeId: toText(stop.ruta_id ?? stop.rutaId) || routeId,
    order: toOrder(stop.orden),
    name: toText(stop.nombre),
    address: toText(stop.direccion),
    lat: toNumber(stop.lat),
    lng: toNumber(stop.lng),
    completed: stop.completada === true,
    type: toText(stop.tipo),
    phone: toText(stop.telefono),
    references: toText(stop.referencias),
    schedule: toText(stop.horario_atencion ?? stop.horarioAtencion),
    notes: toText(stop.notas),
    createdAt: toText(stop.creado_en ?? stop.creadoEn),
    updatedAt: toText(stop.actualizado_en ?? stop.actualizadoEn),
  };
}

/** Normaliza una ruta con sus paradas ordenadas; `null` si no tiene id. */
export function adaptRutaFromBackend(raw: unknown): Ruta | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const route = raw as BackendRutaDTO;
  if (!route.id) return null;

  const id = String(route.id);
  const stops = (Array.isArray(route.paradas) ? route.paradas : [])
    .map((stop) => adaptParadaFromBackend(stop, id))
    .filter((stop): stop is Parada => stop !== null)
    .sort((a, b) => a.order - b.order);

  return {
    id,
    name: toText(route.nombre),
    description: toText(route.descripcion),
    status: toText(route.estado) || 'pendiente',
    assignedPersonalIds: toPersonalIds(route.personal_asignado_ids ?? route.personalAsignadoIds),
    assignedVehicleId: toText(route.vehiculo_asignado_id ?? route.vehiculoAsignadoId) || null,
    startDate: toText(route.fecha_inicio ?? route.fechaInicio),
    endDate: toText(route.fecha_fin ?? route.fechaFin),
    stops,
    createdAt: toText(route.creado_en ?? route.creadoEn),
    updatedAt: toText(route.actualizado_en ?? route.actualizadoEn),
  };
}

/** Lista de rutas tolerante a array directo o envelopes. */
export function adaptRutasFromBackend(response: unknown): Ruta[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptRutaFromBackend(raw))
    .filter((route): route is Ruta => route !== null);
}
