/** Estados del ciclo de vida de una ruta de campo. */
export type RutaStatus = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';

/** Parada de una ruta (`ParadaResponseDto`). */
export interface Parada {
  id: string;
  routeId: string;
  order: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  completed: boolean;
  type: string;
  phone: string;
  references: string;
  schedule: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Ruta de logística de campo (`RutaResponseDto`, incluye `paradas`). */
export interface Ruta {
  id: string;
  name: string;
  description: string;
  status: string;
  assignedPersonalIds: string[];
  assignedVehicleId: string | null;
  startDate: string;
  endDate: string;
  stops: Parada[];
  createdAt: string;
  updatedAt: string;
}

const RUTA_STATUS_LABELS: Readonly<Record<string, string>> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

/** Etiqueta legible del estado de una ruta. */
export function rutaStatusLabel(status: string | undefined | null): string {
  if (!status) return '';
  return RUTA_STATUS_LABELS[status] ?? status;
}

/** Etiqueta legible del tipo de parada. */
export function paradaTypeLabel(type: string | undefined | null): string {
  if (type === 'cliente') return 'Cliente';
  if (type === 'logistica') return 'Logística';
  return type || '—';
}

/** Porcentaje de paradas completadas (0–100). */
export function rutaProgress(route: Ruta): number {
  if (route.stops.length === 0) return 0;
  const completed = route.stops.filter((stop) => stop.completed).length;
  return Math.round((completed / route.stops.length) * 100);
}
