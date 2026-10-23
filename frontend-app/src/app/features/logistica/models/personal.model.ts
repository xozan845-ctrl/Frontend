/** Cargos de personal de campo. */
export type PersonalCargo = 'conductor' | 'auxiliar' | 'supervisor' | 'coordinador' | string;

/** Estados de disponibilidad del personal. */
export type PersonalStatus = 'activo' | 'en_ruta' | 'descansando' | 'inactivo' | string;

/** Personal de logística de campo (`PersonalResponseDto`). */
export interface FieldEmployee {
  id: string;
  name: string;
  lastName: string;
  cargo: PersonalCargo;
  status: PersonalStatus;
  phone: string;
  email: string;
  assignedRouteId: string | null;
  assignedVehicleId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  lat: number | null;
  lng: number | null;
  locationTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
}

const CARGO_LABELS: Readonly<Record<string, string>> = {
  conductor: 'Conductor',
  auxiliar: 'Auxiliar',
  supervisor: 'Supervisor',
  coordinador: 'Coordinador',
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  activo: 'Activo',
  en_ruta: 'En ruta',
  descansando: 'Descansando',
  inactivo: 'Inactivo',
};

/** Nombre completo del colaborador. */
export function personalFullName(employee: FieldEmployee): string {
  return [employee.name, employee.lastName].filter(Boolean).join(' ') || 'Sin nombre';
}

/** Etiqueta legible del cargo. */
export function personalCargoLabel(cargo: string | undefined | null): string {
  if (!cargo) return '—';
  return CARGO_LABELS[cargo] ?? cargo;
}

/** Etiqueta legible del estado. */
export function personalStatusLabel(status: string | undefined | null): string {
  if (!status) return '';
  return STATUS_LABELS[status] ?? status;
}

/** Indica si el colaborador reportó una ubicación válida. */
export function hasLocation(employee: FieldEmployee): boolean {
  return employee.lat !== null && employee.lng !== null;
}
