/** `ServicioResponseDto` de Core Engine (snake_case y aliases camelCase). */
export interface BackendCompanyServiceDTO {
  id?: string | number | null;
  empresa_id?: string | number | null;
  empresaId?: string | number | null;
  codigo?: string | null;
  code?: string | null;
  nombre?: string | null;
  name?: string | null;
  descripcion?: string | null;
  descripcionCorta?: string | null;
  categoria?: string | null;
  marca?: string | null;
  codigo_barras?: string | null;
  codigoBarras?: string | null;
  precio?: number | string | null;
  precio_venta?: number | string | null;
  price?: number | string | null;
  costo?: number | string | null;
  unidad?: string | null;
  duracion_minutos?: number | string | null;
  duracionMinutos?: number | string | null;
  durationMinutes?: number | string | null;
  estado?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

/** Envoltura tolerante de listados (`items`, `data`, `servicios`, etc.). */
export interface BackendCompanyServiceListDTO {
  items?: BackendCompanyServiceDTO[] | null;
  data?: BackendCompanyServiceDTO[] | null;
  results?: BackendCompanyServiceDTO[] | null;
  servicios?: BackendCompanyServiceDTO[] | null;
}
