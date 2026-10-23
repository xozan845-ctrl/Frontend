/** `ParadaResponseDto` de Core Engine (field-service). */
export interface BackendParadaDTO {
  id?: string | null;
  ruta_id?: string | null;
  rutaId?: string | null;
  orden?: string | number | null;
  nombre?: string | null;
  direccion?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  completada?: boolean | null;
  tipo?: string | null;
  telefono?: string | null;
  referencias?: string | null;
  horario_atencion?: string | null;
  horarioAtencion?: string | null;
  notas?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

/** `RutaResponseDto` de Core Engine (field-service). */
export interface BackendRutaDTO {
  id?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  personal_asignado_ids?: string[] | null;
  personalAsignadoIds?: string[] | null;
  vehiculo_asignado_id?: string | null;
  vehiculoAsignadoId?: string | null;
  fecha_inicio?: string | null;
  fechaInicio?: string | null;
  fecha_fin?: string | null;
  fechaFin?: string | null;
  paradas?: unknown[] | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}
