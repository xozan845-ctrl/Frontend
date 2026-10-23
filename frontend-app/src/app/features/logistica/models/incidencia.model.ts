/** Tipos de incidencia de logística de campo. */
export type IncidenciaTipo = 'mecanica' | 'accidente' | 'salud' | 'clima' | 'otro' | string;

/** Estados del ciclo de vida de una incidencia. */
export type IncidenciaStatus = 'abierta' | 'en_progreso' | 'resuelta' | string;

/** Incidencia de logística de campo (`IncidenciaResponseDto`). */
export interface FieldIncident {
  id: string;
  type: IncidenciaTipo;
  status: IncidenciaStatus;
  description: string;
  personalId: string | null;
  vehicleId: string | null;
  routeId: string | null;
  resolution: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Readonly<Record<string, string>> = {
  mecanica: 'Mecánica',
  accidente: 'Accidente',
  salud: 'Salud',
  clima: 'Clima',
  otro: 'Otro',
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  abierta: 'Abierta',
  en_progreso: 'En progreso',
  resuelta: 'Resuelta',
};

/** Etiqueta legible del tipo de incidencia. */
export function incidenciaTypeLabel(type: string | undefined | null): string {
  if (!type) return '—';
  return TYPE_LABELS[type] ?? type;
}

/** Etiqueta legible del estado de la incidencia. */
export function incidenciaStatusLabel(status: string | undefined | null): string {
  if (!status) return '';
  return STATUS_LABELS[status] ?? status;
}
