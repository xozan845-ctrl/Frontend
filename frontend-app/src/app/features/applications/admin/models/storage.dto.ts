/** `EstadoBucketResponseDto` de Core Engine (admin storage). */
export interface BackendStorageTenantDTO {
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

/** `PaginaBucketsResponseDto` de Core Engine. */
export interface BackendStoragePageDTO {
  items?: unknown[];
  total?: string | number | null;
  pagina?: string | number | null;
  limite?: string | number | null;
  paginas?: string | number | null;
}
