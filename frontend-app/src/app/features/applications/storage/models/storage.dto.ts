/** DTOs de Core Engine para almacenamiento del tenant. */
export interface BackendStorageBucketDTO {
  tenant_id?: string | null;
  tenantId?: string | null;
  bucket?: string | null;
  cuota_bytes?: string | number | null;
  cuotaBytes?: string | number | null;
  usado_bytes?: string | number | null;
  usadoBytes?: string | number | null;
  disponible_bytes?: string | number | null;
  disponibleBytes?: string | number | null;
  objetos?: string | number | null;
  estado?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  actualizado_en?: string | null;
  actualizadoEn?: string | null;
}

export interface BackendStorageObjectDTO {
  id?: string | null;
  bucket?: string | null;
  objeto?: string | null;
  nombre?: string | null;
  content_type?: string | null;
  contentType?: string | null;
  carpeta?: string | null;
  descripcion?: string | null;
  etiquetas?: Record<string, string> | null;
  tamano_bytes?: string | number | null;
  tamanoBytes?: string | number | null;
  estado?: string | null;
  subido_por?: string | null;
  subidoPor?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  confirmado_en?: string | null;
  confirmadoEn?: string | null;
  eliminado_en?: string | null;
  eliminadoEn?: string | null;
}

export interface BackendStorageObjectPageDTO {
  items?: unknown[];
  total?: string | number | null;
  pagina?: string | number | null;
  limite?: string | number | null;
  paginas?: string | number | null;
}

export interface BackendPresignedUploadDTO {
  objeto_id?: string | null;
  objetoId?: string | null;
  bucket?: string | null;
  objeto?: string | null;
  url_subida?: string | null;
  urlSubida?: string | null;
  metodo?: string | null;
  headers?: Record<string, string> | null;
  expira_en?: string | null;
  expiraEn?: string | null;
  max_bytes?: string | number | null;
  maxBytes?: string | number | null;
}

export interface BackendStorageDownloadDTO {
  url_descarga?: string | null;
  urlDescarga?: string | null;
  expira_en?: string | null;
  expiraEn?: string | null;
  nombre?: string | null;
  content_type?: string | null;
  contentType?: string | null;
  tamano_bytes?: string | number | null;
  tamanoBytes?: string | number | null;
}
