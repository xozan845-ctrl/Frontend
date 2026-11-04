/**
 * Fixtures de contrato versionados (R-C-8) de los campos `background_*` del
 * backend. La plataforma devuelve un objeto plano; la tienda pública devuelve
 * `{ tienda, ofertas }`.
 */
export const MEDIA_BACKGROUND_PLATFORM_FIXTURE = {
  background_objeto_id: '11111111-2222-4333-8444-555555555555',
  background_media_type: 'video',
  background_url: '/api/v1/storage/public/objetos/11111111-2222-4333-8444-555555555555',
  background_poster_objeto_id: '99999999-8888-4777-8666-555555555555',
  background_poster_url: '/api/v1/storage/public/objetos/99999999-8888-4777-8666-555555555555',
  background_alt: 'Internacional',
  background_overlay: 40,
  background_position: 'center',
  background_activo: true,
  actualizado_en: '2026-11-04T12:00:00.000Z',
} as const;

export const MEDIA_BACKGROUND_STORE_FIXTURE = {
  tienda: {
    id: '22222222-3333-4444-8555-666666666666',
    nombre: 'Tienda Prueba',
    background_objeto_id: '22222222-3333-4444-8555-666666666666',
    background_media_type: 'imagen',
    background_url: '/api/v1/storage/public/objetos/22222222-3333-4444-8555-666666666666',
    background_poster_objeto_id: null,
    background_poster_url: null,
    background_alt: 'Colección',
    background_overlay: 35,
    background_position: 'center',
    background_activo: true,
  },
  ofertas: [],
} as const;
