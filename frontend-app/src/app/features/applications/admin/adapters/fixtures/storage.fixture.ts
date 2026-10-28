/** `EstadoBucketResponseDto` real de `GET /admin/storage/tenants`. */
export const STORAGE_TENANTS_FIXTURE = [
  {
    tenant_id: 'tenant-1',
    bucket: 't-tenant-1',
    cuota_bytes: 5368709120,
    usado_bytes: 1610612736,
    disponible_bytes: 3758096384,
    objetos: 3,
    estado: 'activo',
    creado_en: '2026-10-21T10:00:00.000Z',
    actualizado_en: '2026-10-22T10:00:00.000Z',
  },
  {
    tenant_id: 'tenant-2',
    bucket: 't-tenant-2',
    cuota_bytes: 2147483648,
    usado_bytes: 2147483648,
    disponible_bytes: 0,
    objetos: 5,
    estado: 'suspendido',
    creado_en: '2026-10-20T10:00:00.000Z',
    actualizado_en: '2026-10-22T09:00:00.000Z',
  },
] as const;
