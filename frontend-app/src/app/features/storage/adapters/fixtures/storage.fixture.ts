/** Respuestas reales de `/storage` para el tenant. */
export const BUCKET_FIXTURE = {
  tenant_id: 'tenant-1',
  bucket: 't-tenant-1',
  cuota_bytes: 5368709120,
  usado_bytes: 1610612736,
  disponible_bytes: 3758096384,
  objetos: 2,
  estado: 'activo',
  creado_en: '2026-10-21T10:00:00.000Z',
  actualizado_en: '2026-10-23T10:00:00.000Z',
} as const;

export const OBJECTS_FIXTURE = [
  {
    id: 'objeto-1',
    tenant_id: 'tenant-1',
    bucket: 't-tenant-1',
    objeto: 'productos/objeto-1/foto.png',
    nombre: 'foto.png',
    content_type: 'image/png',
    carpeta: 'productos',
    descripcion: 'Foto del producto',
    etiquetas: { fuente: 'catalogo' },
    tamano_bytes: 204800,
    etag: 'etag-1',
    estado: 'activo',
    subido_por: 'user-1',
    creado_en: '2026-10-22T10:00:00.000Z',
    confirmado_en: '2026-10-22T10:01:00.000Z',
    eliminado_en: null,
  },
  {
    id: 'objeto-2',
    tenant_id: 'tenant-1',
    bucket: 't-tenant-1',
    objeto: 'documentos/objeto-2/factura.pdf',
    nombre: 'factura.pdf',
    content_type: 'application/pdf',
    carpeta: 'documentos',
    descripcion: '',
    etiquetas: {},
    tamano_bytes: 1024,
    etag: null,
    estado: 'activo',
    subido_por: null,
    creado_en: '2026-10-21T10:00:00.000Z',
    confirmado_en: '2026-10-21T10:01:00.000Z',
    eliminado_en: null,
  },
] as const;

export const PRESIGNED_FIXTURE = {
  objeto_id: 'objeto-3',
  bucket: 't-tenant-1',
  objeto: 'productos/objeto-3/nuevo.png',
  url_subida: '/api/v1/storage/subida-mock',
  metodo: 'PUT',
  headers: { 'Content-Type': 'image/png' },
  expira_en: '2026-10-23T10:10:00.000Z',
  max_bytes: 10485760,
} as const;

export const DOWNLOAD_FIXTURE = {
  url_descarga: 'https://minio.test/t-tenant-1/objeto-1',
  expira_en: '2026-10-23T10:10:00.000Z',
  nombre: 'foto.png',
  content_type: 'image/png',
  tamano_bytes: 204800,
} as const;
