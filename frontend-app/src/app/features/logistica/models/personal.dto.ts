/** `PersonalResponseDto` de Core Engine (field-service). */
export interface BackendPersonalDTO {
  id?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  cargo?: string | null;
  estado?: string | null;
  telefono?: string | null;
  email?: string | null;
  ruta_asignada_id?: string | null;
  rutaAsignadaId?: string | null;
  vehiculo_asignado_id?: string | null;
  vehiculoAsignadoId?: string | null;
  hora_check_in?: string | null;
  horaCheckIn?: string | null;
  hora_check_out?: string | null;
  horaCheckOut?: string | null;
  ubicacion_lat?: string | number | null;
  ubicacionLat?: string | number | null;
  ubicacion_lng?: string | number | null;
  ubicacionLng?: string | number | null;
  ubicacion_ts?: string | null;
  ubicacionTs?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  created_at?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
  updated_at?: string | null;
}
